import express from "express";
import { exec } from "child_process";
import util from "util";
import cors from "cors";

const execAsync = util.promisify(exec);
const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"], 
  })
);
app.use(express.json());

const bridgeScriptPath = "./bridge.sh";

app.post("/api/mint", async (req, res) => {
  const { recvAddress, amount, destinationChain } = req.body;

  if (!recvAddress || !amount || !destinationChain) {
    return res.status(400).json({ error: "Missing-fields" });
  }

  let command;

  if (destinationChain === "Sui") {
    command = `bash ${bridgeScriptPath} mint ${amount} ${recvAddress} sui`;
  } else if (destinationChain === "Ethereum") {
    command = `bash ${bridgeScriptPath} eth ${amount} ${recvAddress}`;
  } else {
    return res.status(400).json({ error: "Invalid destination" });
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error("Mint command error:", stderr);
      return res.status(500).json({ error: stderr });
    }
    console.log("Mint command output:", stdout);
    res.json({ message: "Mint successful", output: stdout });
  } catch (error) {
    console.error("Error executing mint command:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.post("/api/burn", async (req, res) => {
  const { amount, userAddress, coinObjectId } = req.body;

  if (!amount || !userAddress || !coinObjectId) {
    console.log(amount);
    console.log(userAddress);
    console.log(coinObjectId);

    return res.status(400).json({ error: "Missing required fields" });
  }

  let command = `bash ${bridgeScriptPath} burn ${amount} ${userAddress} ${coinObjectId}`;

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error("Burn command error:", stderr);
      return res.status(500).json({ error: stderr });
    }
    console.log("Burn command output:", stdout);
    res.json({ message: "Burn operation successful", output: stdout });
  } catch (error) {
    console.error("Error executing burn command:", error);
    res.status(500).json({ error: error.message });
  }
});