require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// CONNECT TO BLOCKCHAIN
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// USE ONE PRIVATE KEY FROM HARDHAT NODE
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const abi = [
  "function createProject() payable",
  "function acceptProject(uint)",
  "function submitWork(uint,string)",
  "function approveWork(uint)",
  "function getProject(uint) view returns (tuple(uint id,address client,address freelancer,uint amount,string workHash,bool isAccepted,bool isCompleted,bool isPaid))"
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

// CREATE PROJECT
app.post("/createProject", async (req, res) => {
  try {
    const { amount } = req.body;

    const tx = await contract.createProject({
      value: ethers.parseEther(amount)
    });

    await tx.wait();

    res.json({ message: "Project created", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT PROJECT
app.post("/acceptProject", async (req, res) => {
  try {
    const { id } = req.body;

    const tx = await contract.acceptProject(id);
    await tx.wait();

    res.json({ message: "Project accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SUBMIT WORK
app.post("/submitWork", async (req, res) => {
  try {
    const { id, hash } = req.body;

    const tx = await contract.submitWork(id, hash);
    await tx.wait();

    res.json({ message: "Work submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPROVE WORK
app.post("/approveWork", async (req, res) => {
  try {
    const { id } = req.body;

    const tx = await contract.approveWork(id);
    await tx.wait();

    res.json({ message: "Payment released" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PROJECT
app.get("/project/:id", async (req, res) => {
  try {
    const data = await contract.getProject(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));