# Project Overview

This repository hosts the development of two distinct Visual Studio Code extensions designed to enhance the development and testing of Alexa skills. Each extension serves a specific purpose and is maintained in separate branches to streamline their development and usage.

## Extensions

### SkillForge Extension for Test Case Execution

The **SkillForge** extension is focused on facilitating the robustness testing of Alexa skills. It provides developers with a comprehensive suite of tools for generating, editing, and running test phrases against their skills to assess and improve their robustness. This extension is particularly useful for developers looking to ensure their Alexa skills respond accurately to a wide range of user inputs.

- **Location**: The SkillForge extension can be found in the `testing` branch of this repository.
- **Main Features**:
  - Dynamic selection of seed phrases for test generation.
  - Saving and managing utterances for testing.
  - Executing tests and analyzing results directly within Visual Studio Code.

### Astro Extension for Phrase Enhancement

The **Astro** extension is tailored for developers who wish to expand their Alexa skill's understanding by adding more paraphrases. It aids in the enhancement of skills by making them more robust against varied phrasing of user commands. Astro provides an intuitive interface for inserting additional paraphrases directly into the skill's interaction model.

- **Location**: The Astro extension is located in the `robustness` branch of this repository.
- **Main Features**:
  - Easy insertion of new paraphrases into the skill's interaction model.
  - Streamlined workflow for updating and expanding skill interactions.
  - Enhanced skill robustness through diversified phrase recognition.

## Getting Started

To get started with either the SkillForge or Astro extension, follow these steps:

1. **Clone the Repository**: Begin by cloning this repository to your local machine using your preferred Git client.
gh repo clone AngeloConca99/toolTestingAmazonSkills

2. **Switch to the Relevant Branch**: Depending on the extension you wish to use, switch to the appropriate branch.
- For SkillForge:
  ```
  git checkout testing
  ```
- For Astro:
  ```
  git checkout robustness
  ```
3. **Follow the Installation Instructions**: Each branch contains a specific `README.md` file with detailed installation and usage instructions for the respective extension.


## Support

If you encounter any issues or have questions regarding the usage of these extensions, please file an issue in this repository, specifying the extension in question.

Thank you for supporting the development of tools that enhance the robustness and versatility of Alexa skills.
