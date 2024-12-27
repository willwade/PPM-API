const { execSync } = require("child_process");
const path = require("path");

try {
  // Install Python dependencies
  console.log("Installing Python dependencies...");
  execSync("pip install datasets", { stdio: "inherit" });

  // Run the Python script
  console.log("Running Python script to generate training text...");
  const scriptPath = path.join(__dirname, "../generate_training_text.py");
  execSync(`python ${scriptPath}`, { stdio: "inherit" });

  console.log("Python script executed successfully.");
} catch (error) {
  console.error("Error while running Python script:", error.message);
  process.exit(1); // Fail the build if the script fails
}
