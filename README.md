# Actions workflow run

This GitHub Action will allow you to easily execute Chassy workflows within your
automation pipelines.

## Authentication with Chassy

In addition to any configuration options, you also must have `CHASSY_TOKEN`
defined within the environment. This is a secret value and as such should be
stored within your repository's or organization's GitHub secrets. This value is
what allows Chassy to authorize your workflow execution and prevents strangers
from executing workflows that aren't theirs. It is quite a long string encoded
in base64.

| Variable       | Description                                           |
| -------------- | ----------------------------------------------------- |
| `CHASSY_TOKEN` | Authentication token for automated workflow execution |

If `CHASSY_TOKEN` isn't defined, the action will fail to execute the workflow.

## Usage

Each of these options can be used in the `with` section when you call this
action.

| Configuration | Description                                 | Type      |
| ------------- | ------------------------------------------- | --------- |
| `workflowId`  | ID of workflow you wish to execute          | `string`  |
| `sync`        | Await completion of workflow execution      | `boolean` |
| `parameters`  | User-defined parameters for workflow (JSON) | `string`  |

### Default Values

| Configuration | Default Value |
| ------------- | ------------- |
| `workflowId`  | **NONE**      |
| `sync`        | `true`        |
| `parameters`  | `'{}'`        |

For example, inspect the following basic configuration:

```yml
example-action:
  name: Example Action
  runs-on: ubuntu-latest
  env:
    CHASSY_TOKEN: <base64 encoded token>
  steps:
    - name: Run a workflow
      id: workflow-run
      uses: chassyflow/actions-workflow-run@v1.2.0
      with:
        workflowId: '<some workflow id>'
    - name: Print Workflow Output
      id: output
      run: echo "${{ steps.workflow-run.outputs.workflowexecution }}"
```

## How to use Create GitHub Action for Workflow Run

The action has next inputs

```yaml
workflowId:
  description: 'The id of the specified workflow'
  required: true
sync:
  description: 'Waits for workflow execution to complete'
  required: false
  default: 'true'
parameters:
  description: 'Parameters with any fields in JSON format'
  required: false
backendEnvironment:
  description:
    'Defines what Chassy backend environment to use. Can be equal to PROD,
    STAGE, DEV'
  required: false
```

Get the action name and version from the tags of this repository and reference
it in your workflow

## Development Setup

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps before you can develop your action.

> [!NOTE]
>
> You'll need to have a reasonably modern version of
> [Node.js](https://nodejs.org) handy (20.x or later should work!). If you are
> using a version manager like [`nodenv`](https://github.com/nodenv/nodenv) or
> [`nvm`](https://github.com/nvm-sh/nvm), this template has a `.node-version`
> file at the root of the repository that will be used to automatically switch
> to the correct version when you `cd` into the repository. Additionally, this
> `.node-version` file is used by GitHub Actions in any `actions/setup-node`
> actions.

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
     ✓ test runs (95ms)

   ...
   ```

## How to validate the Action

You can validate the action by referencing it in a workflow file. For example,
[`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an action
in the same repository. To test the action push code to a branch, it will
trigger the ci.yml workflow, where you can see execution status and where you
can see any logs you've specified in the main.ts file

## Usage

After testing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: actions/typescript-action@v1 # Commit with the `v1` tag
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent release tag by looking at the local data available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the latest release tag
   and provides a regular expression to validate the format of the new tag.
1. **Tagging the new release:** Once a valid new tag is entered, the script tags
   the new release.
1. **Pushing the new tag to the remote:** Finally, the script pushes the new tag
   to the remote repository. From here, you will need to create a new release in
   GitHub and users can easily reference the new tag in their workflows.
