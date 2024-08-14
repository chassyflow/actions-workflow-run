import { WorkflowExecution, WorkflowStatuses } from './types'
import { RETRY_IN_SECONDS } from './constants'

export async function waitTillWorkflowExecuted({
  accessToken,
  workflowExecutionId,
  workflowRunURL,
  sync
}: {
  accessToken: string
  workflowExecutionId: string
  workflowRunURL: string
  sync: boolean
}): Promise<WorkflowExecution> {
  return new Promise((res, rej) => {
    const fetchWorkflowExecution = async (): Promise<Response> =>
      fetch(`${workflowRunURL}/${workflowExecutionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken
        }
      })

    const checkWorkflowExecution = async (): Promise<void> => {
      try {
        const rawResponse = await fetchWorkflowExecution()
        if (!rawResponse.ok) {
          throw new Error(
            `Network response was not ok ${rawResponse.statusText}`
          )
        }
        const response: WorkflowExecution = await rawResponse.json()
        if (response.status === WorkflowStatuses.SUCCESS) {
          if (!sync) {
            res(response)
            return
          }
          // check that packages are all completed
          let complete = true
          if (response.packages) {
            for (const pkg of response.packages) {
              switch (pkg.status) {
                case 'AVAILABLE': {
                  complete &&= true
                  break
                }
                case 'PENDING': {
                  complete = false
                  break
                }
                case 'FAILED': {
                  rej(
                    new Error(
                      `Failed to publish ${pkg.access ? `${pkg.access} ` : ''}${pkg.packageClass} package ${pkg.name} of type ${pkg.type}`
                    )
                  )
                }
              }
            }
          }
          if (response.deployments) {
            for (const deployment of response.deployments) {
              switch (deployment.status) {
                case 'COMPLETE': {
                  complete &&= true
                  break
                }
                case 'INPROGRESS' || 'PENDING': {
                  complete = false
                  break
                }
                case 'CANCELED' || 'FAILED': {
                  rej(
                    new Error(
                      `Deployment of ${deployment.release.name} version ${deployment.release.versionInfo} to ${deployment.machines ? deployment.machines.length : 0} machines in fleet with ID ${deployment.fleetId} ${deployment.status}`
                    )
                  )
                  break
                }
              }
            }
          }
          if (complete) {
            res(response)
            return
          }
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
