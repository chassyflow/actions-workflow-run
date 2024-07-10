import * as core from '@actions/core'
import * as github from '@actions/github'
import { BACKEND_BASE_URLS_BY_ENV } from './constants'
import { waitTillWorkflowExecuted } from './wait-till-workflow-executed'

export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const chassyToken = process.env.CHASSY_TOKEN
    const userDefinedParameters: Record<string, unknown> = JSON.parse(
      core.getInput('parameters') || '{}'
    )
    const apiBaseUrl =
      BACKEND_BASE_URLS_BY_ENV[core.getInput('backendEnvironment')] ||
      BACKEND_BASE_URLS_BY_ENV['PROD']

    if (!chassyToken) {
      throw new Error('Chassy token isn`t present in env variables')
    }

    const workflowRunURL = `${apiBaseUrl}/workflow/${workflowId}/run`
    let response
    try {
      const rawResponse = await fetch(workflowRunURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: chassyToken
        },
        body: JSON.stringify({
          githubData: {
            envContext: process.env,
            githubContext: { ...userDefinedParameters, ...github.context },
            ...(Object.keys(userDefinedParameters).length && {
              parameters: userDefinedParameters
            })
          }
        })
      })
      if (!rawResponse.ok) {
        throw new Error(`Network response was not ok ${rawResponse.statusText}`)
      }
      response = await rawResponse.json()
    } catch (e) {
      console.debug(`Error during making POST request to ${workflowRunURL}`)
      if (e instanceof Error) throw new Error(e.message)
    }

    const workflowExecutionId = response.id

    core.info(
      `Workflow steps \n ${JSON.stringify(response.graph.steps, null, 2)}`
    )
    core.notice(
      `You can find the visual representation of the steps graph on [Chassy Web Platform](https://console.test.chassy.dev/workflows/${response.workflowId}/${workflowExecutionId})`
    )

    const workflowExecution = await waitTillWorkflowExecuted({
      accessToken: chassyToken,
      workflowExecutionId,
      workflowRunURL
    })

    core.info('\u001b[32mWorkflow is executed successfully!')

    core.startGroup('Full workflow run info')
    console.log(JSON.stringify(workflowExecution, null, 2))
    core.endGroup()

    if (workflowExecution.packages) {
      core.notice(`Created packages`)
      console.log(JSON.stringify(workflowExecution.packages, null, 2))
    }

    if (workflowExecution.releases) {
      core.notice(`Created releases`)
      console.log(JSON.stringify(workflowExecution.releases, null, 2))
    }

    if (workflowExecution.deployments) {
      core.notice(`Created deployments`)
      console.log(JSON.stringify(workflowExecution.deployments, null, 2))
    }

    core.notice(
      `For more information, visit [Chassy Web Platform](https://console.test.chassy.dev/workflows/${response.workflowId}/${workflowExecutionId})`
    )

    core.setOutput(
      'workflowExecution',
      JSON.stringify(workflowExecution, null, 2)
    )
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
