# SkillForge README

This Visual Studio Code extension facilitates the robustness testing of Alexa skills by providing an integrated web user interface for selecting, editing, and generating test phrases from seeds through three specialized panels: the Generation Panel, the Save Panel, and the Testing Panel.

## Key Features

- **Dynamic Seed Selection**: Users can select or deselect seed phrases in the Generation Panel. Seeds can be customized before generating paraphrases.

- **Utterance Saving**: In the Save Panel, users save the selected utterances, which will then be used to perform the tests.

- **Test Execution**: In the Testing Panel, users can execute tests on the saved utterances, choosing to test everything or individually and modifying the test phrases if necessary.

- **Results Analysis**: In the Results Panel, the user views the result of each test case performed, with the option to click for additional details directly from the testing panel.

## Folders and Files

- **GenerateSeeds**: Contains the input file and output for VUI-UpSet.
- **SkillTestSaved**: Stores the selected utterances on which the tests will be performed.
- **Result-Test**: Contains the test results that were decided to be saved
- **TestResult**: Collects the summary of the tests performed.

## Extension User Manual

This chapter provides a detailed guide to installing and using the "SkillForge" extension in the Visual Studio Code environment. This extension is designed to facilitate the robustness testing of Alexa skills, offering developers an intuitive and functional suite of tools for assessing and improving their voice applications.

### Key Features of the Extension

The "SkillForge" extension integrates several features, each designed to support specific phases of the Alexa skill testing process.

#### Dynamic Selection of Seed Phrases

The **Generation Panel** offers users the ability to dynamically select seed phrases, allowing for detailed customization before generating paraphrases. This feature ensures developers can tailor testing to the specific needs of their skills, guaranteeing a tailored approach to robustness evaluation.

#### Saving Utterances for Testing

Through the **Save Panel**, users can save the chosen utterances for testing. These saved utterances form the data set on which tests will be conducted, providing developers complete control over the test material used.

#### Execution of Tests

The **Testing Panel** provides the functionality to run tests on saved utterances. Users are free to test the entire set of utterances or select only some for more targeted analysis. The ability to modify test phrases directly from the panel significantly increases the flexibility of the skill verification process.

#### Results Analysis

In the **Results Panel**, users can examine the outcome of each test case. This panel provides immediate feedback on the effectiveness of the tested skills, with the ability to access additional details directly from the testing panel. This feature proves to be an indispensable tool for developers, allowing them to quickly identify areas for improvement in their Alexa skills.

### Prerequisites
Before you can use the "SkillForge" extension in Visual Studio Code, you must meet some essential prerequisites to ensure the development environment works correctly. This section provides details on how to install and configure the required components.

#### Node.js

Node.js is essential for running ASK CLI and other dependencies. The LTS (Long Term Support) version of Node.js is recommended for its stability and compatibility. It is available on the [official Node.js website](https://nodejs.org/).

#### ASK CLI

The *Alexa Skills Kit Command Line Interface* (ASK CLI) is a command-line tool that facilitates the development of Alexa skills, allowing the management of the skill lifecycle. Installing ASK CLI requires Node.js, and can be done through npm (Node Package Manager) with the command: npm install -g ask-cli

Follow the official Amazon documentation to configure ASK CLI with your AWS and Amazon Developer account.

#### Java JRE 8

Java JRE (Java Runtime Environment) 8 is necessary for some extension dependencies. Check your Java version with: java -version

If necessary, Java JRE 8 can be downloaded from the [official Oracle website](https://www.oracle.com/java/technologies/javase-jre8-downloads.html).

## Downloading and Installing the Extension

Downloading and Installing the Extension
Once the prerequisites are met, installing the "SkillForge" extension can be completed by following a series of simple but fundamental steps. For the first operation, head to this project's release page, available [here](https://github.com/AngeloConca99/toolTestingAmazonSkills/releases/download/1.0.1/SkillForge-1.0.0.vsix).

Upon reaching the release page, you can view all the versions of the extension published so far. Each release is accompanied by a brief description of the features introduced or bugs resolved, allowing you to consciously choose the most suitable version for your needs. The download procedure involves selecting the SkillForge.vsix file corresponding to the desired release. The download starts by directly clicking on the file name, saving it in an easily accessible folder on your computer.

WWith the .vsix file downloaded, installation becomes a breeze. Open Visual Studio Code and pay attention to the Extensions section, easily accessible via the Ctrl+Shift+X key combination. Within this area of Visual Studio Code, there is an icon representing three vertical dots, located in the upper right corner. Clicking on this icon opens a contextual menu where you select the "Install from VSIX..." option. A dialogue window opens, allowing you to navigate the folders on your computer in search of the previously downloaded .vsix file. Selecting the file and confirming initiates the installation of the extension, which will be completed in a few seconds.


## Available Commands

- `SkillForge.GenerationPanel`: Launches the Generation Panel for paraphrases.
- `SkillForge.SavePanel`: Opens the Save Panel.
- `SkillForge.TestingPanel`: Opens the Testing Panel.
- `SkillForge.openReadme`: Opens this README file.

## Contributing

Contributions and suggestions to improve this extension are welcome. Feel free to open issues or pull requests for any enhancements or feedback.