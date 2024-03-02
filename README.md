# Alexa-Skill-Test-Robustness README

This Visual Studio Code extension facilitates robustness testing of Alexa skills by providing an integrated web user interface for selecting, editing, and generating test phrases based on seeds.

## Key Features

- **Dynamic Seed Selection**: Users can select or deselect seed phrases using checkboxes. By default, all seeds are selected.
- **Similarity Score Adjustment**: A slider allows setting a similarity score between the seed phrases and the generated phrases, ranging from 0% to 100%, to refine the relevance of the generated phrases to the original seeds.
- **Seed Editing**: Seeds can be edited by clicking on the "Edit" button, allowing users to customize the seeds before generating phrases. This offers greater flexibility in test preparation.
- **JSON File Generation**: At completion, the extension generates a JSON file containing the selected and edited phrases, ready to be used as input in Alexa test tools.

## Prerequisites

- **Java JRE 8**: Java JRE 8 is required for the extension to function. Make sure it is installed and configured on your system.

## Installation

1. Search for "Alexa-Skill-Test-Robustness" in the Visual Studio Code Marketplace.
2. Click on "Install" to install the extension.

## Usage

1. **Start the Extension**: Click on the extension icon in the VS Code Activity Bar to open the web user interface.
2. **Seed Selection**: Use the checkboxes to choose the seeds from which to generate phrases.
3. **Adjust the Similarity Score**: Set the desired similarity score between the seeds and the generated phrases using the slider.
4. **Edit Seeds**: Click on "Edit" to customize the seeds.
5. **Generate JSON File**: Complete the selection and editing of seeds to automatically generate a JSON file that can be used in Alexa test tools.

## Available Commands

- `alexa-skill-test-robustness.helloWorld`: Starts the main panel of the extension.
- `alexa-skill-test-robustness.openReadme`: Opens this README file.

## Contributing

Contributions and suggestions to improve this extension are welcome. Open issues or pull requests on the project's GitHub repository for any enhancements or feedback.