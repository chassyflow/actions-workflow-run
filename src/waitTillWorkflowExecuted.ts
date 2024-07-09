import * as core from '@actions/core'
import { WorkflowExecution, WorkflowStatuses } from './types'
import { RETRY_IN_SECONDS } from './constants'

export const waitTillWorkflowExecuted = ({
  accessToken,
  workflowExecutionId,
  workflowRunURL
}: {
  accessToken: string
  workflowExecutionId: string
  workflowRunURL: string
}): Promise<WorkflowExecution> =>
  new Promise((res, rej) => {
    const fetchWorkflowExecution = () =>
      fetch(`${workflowRunURL}/${workflowExecutionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken
        }
      })

    const checkWorkflowExecution = async () => {
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
          core.info(`Workflow still in progress, please wait`)
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
