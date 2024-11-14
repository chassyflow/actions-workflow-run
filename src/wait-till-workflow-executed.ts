import { WorkflowExecution, WorkflowStatuses } from './types'
import { backOff } from 'exponential-backoff'
import { RETRY_IN_SECONDS } from './constants'

export async function waitTillWorkflowExecuted({
  accessToken,
  workflowExecutionId,
  workflowRunURL
}: {
  accessToken: string
  workflowExecutionId: string
  workflowRunURL: string
}): Promise<WorkflowExecution> {
  return new Promise((res, rej) => {
    const fetchWorkflowExecution = async (): Promise<Response> =>
      backOff(
        () =>
          fetch(`${workflowRunURL}/${workflowExecutionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: accessToken
            }
          }),
        {
          numOfAttempts: 6,
          timeMultiple: 2,
          startingDelay: 2
        }
      )

    const checkWorkflowExecution = async (): Promise<void> => {
      try {
        const rawResponse = await fetchWorkflowExecution()
        if (!rawResponse.ok) {
          throw new Error(
            `Network response was not ok ${rawResponse.statusText}`
          )
        }
        const response = await rawResponse.json()
        if (response.status === WorkflowStatuses.SUCCESS) {
          res(response)
          return
        }

        if (
          response.status === WorkflowStatuses.CHASSY_ERROR ||
          response.status === WorkflowStatuses.CONFIG_ERROR ||
          response.status === WorkflowStatuses.EXECUTION_ERROR
        ) {
          rej(response.errorMessage)
        }

        if (response.status === WorkflowStatuses.IN_PROGRESS) {
          console.log(`Workflow still in progress, please wait`)
        }
      } catch (e) {
        console.debug(
          `Error during making GET request to get workflow run info ${workflowRunURL}/${workflowExecutionId}`
        )
        if (e instanceof Error) rej(e.message)
      } finally {
        clearInterval(waitInterval)
      }
    }

    const waitInterval = setInterval(
      checkWorkflowExecution,
      RETRY_IN_SECONDS * 1000
    )
  })
}
