# Alexa Skill Test Robustness README

This Visual Studio Code extension facilitates the robustness testing of Alexa skills by providing an integrated web user interface for selecting, editing, and generating test phrases from seeds through three specialized panels: the Generation Panel, the Save Panel, and the Testing Panel.

## Key Features

- **Dynamic Seed Selection**: Users can select or deselect seed phrases in the Generation Panel. Seeds can be customized before generating paraphrases.

- **Utterance Saving**: In the Save Panel, users save the selected utterances, which will then be used to perform the tests.

- **Test Execution**: In the Testing Panel, users can execute tests on the saved utterances, choosing to test everything or individually and modifying the test phrases if necessary.

- **Results Analysis**: In the Results Panel, the user views the result of each test case performed, with the option to click for additional details directly from the testing panel.

## Folders and Files

- **GenerateSeeds**: Contains the input file and output for VUI-UpSet.
- **SkillTestSaved**: Stores the selected utterances on which the tests will be performed.
- **Result-Test**: Contains the tests that have been decided to save.
- **TestResult**: Collects the summary of the tests performed.

## Prerequisites

- **ASK CLI**: ASK CLI must be installed and configured on the system for the extension to function properly.

## Installation

To install and start the extension, follow these steps:
1. Ensure that ASK CLI, Java JRE 8, and Node.js are installed and configured on your system.
2. Open Visual Studio Code.
3. Click on the extension icon in the Activity Bar to launch it.

## Available Commands

- `alexa-skill-test-robustness.GenerationPanel`: Launches the Generation Panel for paraphrases.
- `alexa-skill-test-robustness.SavePanel`: Opens the Save Panel.
- `alexa-skill-test-robustness.TestingPanel`: Opens the Testing Panel.
- `alexa-skill-test-robustness.openReadme`: Opens this README file.

## Contributing

Contributions and suggestions to improve this extension are welcome. Open issues or pull requests on the project's GitHub repository for any enhancements or feedback.
