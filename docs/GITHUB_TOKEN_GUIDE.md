# GitHub Token Guide for Co-op Challenge AI Analysis

This guide provides detailed instructions on how to create and use a GitHub Personal Access Token (PAT) with the correct permissions for the AI analysis feature in the Co-op Challenge game.

A `401 Authorization Error` means that the token is missing, invalid, or does not have the required scopes.

## Step 1: Generate a New Personal Access Token

1.  **Navigate to GitHub Developer Settings:**
    *   Go to your GitHub account.
    *   Click on your profile picture in the top-right corner and select **Settings**.
    *   In the left sidebar, scroll down and click on **Developer settings**.
    *   Select **Personal access tokens**, and then choose **Tokens (classic)**.

2.  **Create a New Token:**
    *   Click the **Generate new token** button and select **Generate new token (classic)**.
    *   You will be prompted to enter your password.

3.  **Configure the Token:**
    *   **Note:** Give your token a descriptive name, for example, `my-awesome-dragon-boat-copilot`.
    *   **Expiration:** Set an expiration date for your token. For security, avoid "No expiration" for production use.
    *   **Select scopes:** This is the most critical step. You **must** check the box for **`copilot`**. This single scope grants all the necessary permissions for the SDK to work.

    ![GitHub Token Scopes](https://i.imgur.com/your-image-url.png) <!-- Placeholder for an image if one were to be generated -->

4.  **Generate and Copy the Token:**
    *   Click the **Generate token** button at the bottom of the page.
    *   **IMPORTANT:** Your new token will be displayed only once. Copy it immediately and store it in a safe place. You will not be able to see it again.

## Step 2: Update Your Local Environment

1.  **Open the `.env` file:**
    *   In the root directory of the `my-awesome-dragon-boat` project, find or create a file named `.env`.

2.  **Set the `GITHUB_TOKEN`:**
    *   Add or update the following line in your `.env` file, replacing `ghp_YourCopiedToken...` with the token you just copied:

    ```env
    GITHUB_TOKEN=ghp_YourCopiedToken...
    ```

    *   Ensure there are no extra spaces or characters.

## Step 3: Restart the Application

To apply the new token, you must rebuild and restart your Docker containers.

1.  **Stop any running containers:**
    *   If `docker compose up` is running, press `Ctrl + C` in the terminal.

2.  **Rebuild and start the services:**
    *   Run the following command in your terminal from the project's root directory:

    ```bash
    docker compose up --build
    ```

This will restart the backend service with the new, valid `GITHUB_TOKEN`, which should resolve the `401 Authorization Error`.
