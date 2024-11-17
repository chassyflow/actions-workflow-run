import * as core from '@actions/core'
import * as github from '@actions/github'
import { BACKOFF_CONFIG, BASE_URLS_BY_ENV } from './constants'
import { waitTillWorkflowExecuted } from './wait-till-workflow-executed'
import { TokenData } from './types'
import { backOff } from 'exponential-backoff'

export async function run(): Promise<void> {
  try {
    const workflowId: string = core.getInput('workflowId')
    const sync: boolean = core.getBooleanInput('sync') ?? true
    const chassyRefreshTokenB64 = process.env.CHASSY_TOKEN
    if (chassyRefreshTokenB64 === undefined) {
      throw new Error('CHASSY_TOKEN not provided in environment')
    } else if (chassyRefreshTokenB64 === '') {
      throw new Error('CHASSY_TOKEN value is empty string')
    }
    const userDefinedParameters: Record<string, unknown> = JSON.parse(
      core.getInput('parameters') || '{}'
    )
    const { apiBaseUrl, frontendBaseUrl } =
      BASE_URLS_BY_ENV[core.getInput('backendEnvironment')] ||
      BASE_URLS_BY_ENV['PROD']

    core.info('making request to refresh token')

    // use refresh token to get valid access token
    const refreshTokenURL = `${apiBaseUrl}/token/user`
    const tokenRequestBody = {
      token: chassyRefreshTokenB64
    }
    let refreshTokenResponse: TokenData
    try {
      const rawResponse = await backOff(
        () =>
          fetch(refreshTokenURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tokenRequestBody)
          }),
        BACKOFF_CONFIG
      )
      if (!rawResponse.ok) {
        throw new Error(`Network response was not ok ${rawResponse.statusText}`)
      }
      refreshTokenResponse = await rawResponse.json()
    } catch (e) {
      console.debug('Failed to get refresh token')
      if (e instanceof Error) throw new Error(e.message)
      else return // should never run, just used to tell type-checker to chill
    }

    const chassyAuthToken = refreshTokenResponse.idToken

    core.info('making request to run workflow')

    // run workflow
    const workflowRunURL = `${apiBaseUrl}/workflow/${workflowId}/run`
    let response
    try {
      const rawResponse = await backOff(
        () =>
          fetch(workflowRunURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: chassyAuthToken
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
          }),
        BACKOFF_CONFIG
      )
      if (!rawResponse.ok) {
        throw new Error(`Network response was not ok ${rawResponse.statusText}`)
      }
      response = await rawResponse.json()
    } catch (e) {
      console.debug(`Failed to start workflow run`)
      if (e instanceof Error) throw new Error(e.message)
    }

    const workflowExecutionId = response.id

    core.info(
      `Workflow steps \n ${JSON.stringify(response.graph.steps, null, 2)}`
    )
    core.notice(
      `You can find the visual representation of the steps graph on [Chassy Web Platform](${frontendBaseUrl}/workflows/${response.workflowId}?runId=${workflowExecutionId})`
    )

    if (!sync) {
      core.notice('`sync` disabled. Exiting.')
      return
    }

    const workflowExecution = await waitTillWorkflowExecuted({
      accessToken: chassyAuthToken,
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
      `For more information, visit [Chassy Web Platform](${frontendBaseUrl}/workflows/${response.workflowId}?runId=${workflowExecutionId})`
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
