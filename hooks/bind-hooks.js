// Run `npm install` at the root of the project to run this file
import * as fs from "fs";
import * as path from "path";

function bindCustomCommitMsgHook() {
    const __dirname = path.resolve();
    const hookSrcPath = path.resolve(
        __dirname,
        ".",
        "hooks",
        "commit-msg.sample"
    );
    const hookDestPath = path.resolve(
        __dirname,
        ".",
        ".git",
        "hooks",
        "commit-msg"
    );

    try {
        // Check if the commit-msg hook exists in the hooks directory
        if (fs.existsSync(hookSrcPath)) {
            // Ensure the .git/hooks directory exists
            if (!fs.existsSync(path.dirname(hookDestPath))) {
                fs.mkdirSync(path.dirname(hookDestPath), { recursive: true });
            }
            const content = fs.readFileSync(hookSrcPath, "utf8");

            const convertedContent = content.replace(/\r\n/g, "\n"); // Replace CRLF with LF (Git-Bash needs LF)
            fs.writeFileSync(hookDestPath, convertedContent, "utf8");
            fs.chmodSync(hookDestPath, 0o755); // Ensure the hook is executable
            console.log("Custom commit-msg hook has been set up successfully.");
        } else {
            console.error(
                "Custom commit-msg hook not found in hooks directory:",
                hookSrcPath
            );
        }
    } catch (err) {
        console.error("Failed to set up custom commit-msg hook:", err);
    }
}

// Execute the function
bindCustomCommitMsgHook();
