Smart Commit with Documentation Update
We're ready to commit our most recent work. Please do this in order:

1. Spawn a subagent Task to Run the complete test suite and make sure there are no failing tests
1. Spawn a subagent Task to analyze the documentation - Review the staged changes and compare them to the existing project documentation (README.md, docs/, API documentation, etc.) to identify if any documentation needs to be updated to reflect these changes.
1. Update documentation - If any documentation needs updating based on the changes, please update the relevant documentation files to keep them in sync with the code changes.
1. Stage the files for commit - First, stage all the files that need to be committed using git add.
1. Spawn a subagent Task to Review the staged files - Show me what files are staged and provide a summary of the changes that will be committed.
1. Add updated documentation - If documentation was updated, add those documentation files to the commit as well.
1. Commit and push - Create a meaningful commit message that describes both the code changes and any documentation updates, then commit and push the changes.

Please be thorough in your review and make sure the documentation accurately reflects the current state of the code after these changes. When you can run the subagents tasks in parallel.
$ARGUMENTS
