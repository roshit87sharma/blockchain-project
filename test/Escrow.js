const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Escrow", function () {
  async function deployEscrowFixture() {
    const [client, freelancer, other] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    return { escrow, client, freelancer, other };
  }

  describe("Project lifecycle", function () {
    it("Should create a project with locked payment", async function () {
      const { escrow, client } = await loadFixture(deployEscrowFixture);
      const amount = ethers.parseEther("1");

      await expect(escrow.connect(client).createProject({ value: amount }))
        .to.emit(escrow, "ProjectCreated")
        .withArgs(1, client.address, amount);

      const project = await escrow.getProject(1);
      expect(project.client).to.equal(client.address);
      expect(project.freelancer).to.equal(ethers.ZeroAddress);
      expect(project.amount).to.equal(amount);
      expect(project.isAccepted).to.equal(false);
      expect(project.isCompleted).to.equal(false);
      expect(project.isPaid).to.equal(false);
    });

    it("Should allow a freelancer to accept and submit work, then client approves payment", async function () {
      const { escrow, client, freelancer } = await loadFixture(deployEscrowFixture);
      const amount = ethers.parseEther("1");
      await escrow.connect(client).createProject({ value: amount });

      await expect(escrow.connect(freelancer).acceptProject(1))
        .to.emit(escrow, "ProjectAccepted")
        .withArgs(1, freelancer.address);

      await expect(escrow.connect(freelancer).submitWork(1, "QmHash"))
        .to.emit(escrow, "WorkSubmitted")
        .withArgs(1, "QmHash");

      const project = await escrow.getProject(1);
      expect(project.freelancer).to.equal(freelancer.address);
      expect(project.workHash).to.equal("QmHash");
      expect(project.isCompleted).to.equal(true);

      await expect(() => escrow.connect(client).approveWork(1))
        .to.changeEtherBalances([freelancer, escrow], [amount, -amount]);

      await expect(escrow.connect(client).approveWork(1)).to.be.revertedWith("Already paid");
    });
  });

  describe("Validation checks", function () {
    it("Should reject acceptProject for a non-existing project", async function () {
      const { escrow, freelancer } = await loadFixture(deployEscrowFixture);
      await expect(escrow.connect(freelancer).acceptProject(1)).to.be.revertedWith("Project not found");
    });

    it("Should reject submitWork from a different account", async function () {
      const { escrow, client, freelancer, other } = await loadFixture(deployEscrowFixture);
      const amount = ethers.parseEther("1");
      await escrow.connect(client).createProject({ value: amount });
      await escrow.connect(freelancer).acceptProject(1);

      await expect(escrow.connect(other).submitWork(1, "QmHash")).to.be.revertedWith("Not freelancer");
    });

    it("Should reject approveWork by a non-client", async function () {
      const { escrow, client, freelancer, other } = await loadFixture(deployEscrowFixture);
      const amount = ethers.parseEther("1");
      await escrow.connect(client).createProject({ value: amount });
      await escrow.connect(freelancer).acceptProject(1);
      await escrow.connect(freelancer).submitWork(1, "QmHash");

      await expect(escrow.connect(other).approveWork(1)).to.be.revertedWith("Not client");
    });

    it("Should reject approveWork before work is submitted", async function () {
      const { escrow, client, freelancer } = await loadFixture(deployEscrowFixture);
      const amount = ethers.parseEther("1");
      await escrow.connect(client).createProject({ value: amount });
      await escrow.connect(freelancer).acceptProject(1);

      await expect(escrow.connect(client).approveWork(1)).to.be.revertedWith("Work not submitted");
    });
  });
});
