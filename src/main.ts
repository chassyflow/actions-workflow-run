import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const chassyToken: string = core.getInput('chassyToken')
    const parameters: Record<string, unknown> = JSON.parse(
      core.getInput('parameters') || '{}'
    )

    const workflowRunURL = `https://api.test.chassy.dev/v1/workflow/${workflowId}/run`
    let response
    try {
      const rawResponse = await fetch(workflowRunURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chassyToken}`
        },
        body: JSON.stringify({
          githubData: {
            envContext: {},
            githubContext: {}
          },
          dryRun: true
        })
      })
      if (!rawResponse.ok) {
        throw new Error('Network response was not ok ' + rawResponse.statusText)
      }
      response = rawResponse.json()
    } catch (e) {
      console.debug(`Error during making POST request to ${workflowRunURL}`)
      if (e instanceof Error) core.setFailed(e.message)
    }

    console.log('response', response)
    console.log('workflowId', workflowId)
    console.log('chassyToken', chassyToken)
    console.log('parameters', parameters)
    console.log('github.context', github)
    // Set outputs for other workflow steps to use
    core.setOutput('workflowExecution', JSON.stringify(response))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
