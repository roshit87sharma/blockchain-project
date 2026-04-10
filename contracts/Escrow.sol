// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {

    uint public projectCount;

    struct Project {
        uint id;
        address payable client;
        address payable freelancer;
        uint amount;
        string workHash;
        bool isAccepted;
        bool isCompleted;
        bool isPaid;
    }

    mapping(uint => Project) public projects;

    event ProjectCreated(uint id, address client, uint amount);
    event ProjectAccepted(uint id, address freelancer);
    event WorkSubmitted(uint id, string hash);
    event PaymentReleased(uint id, address freelancer);

    function createProject() public payable {
        require(msg.value > 0, "Send ETH");

        projectCount++;

        projects[projectCount] = Project(
            projectCount,
            payable(msg.sender),
            payable(address(0)),
            msg.value,
            "",
            false,
            false,
            false
        );

        emit ProjectCreated(projectCount, msg.sender, msg.value);
    }

    function acceptProject(uint _id) public {
        Project storage p = projects[_id];

        require(p.id != 0, "Project not found");
        require(!p.isAccepted, "Already accepted");

        p.freelancer = payable(msg.sender);
        p.isAccepted = true;

        emit ProjectAccepted(_id, msg.sender);
    }

    function submitWork(uint _id, string memory _hash) public {
        Project storage p = projects[_id];

        require(p.freelancer == msg.sender, "Not freelancer");
        require(p.isAccepted, "Not accepted");

        p.workHash = _hash;
        p.isCompleted = true;

        emit WorkSubmitted(_id, _hash);
    }

    function approveWork(uint _id) public {
        Project storage p = projects[_id];

        require(p.client == msg.sender, "Not client");
        require(p.isCompleted, "Work not submitted");
        require(!p.isPaid, "Already paid");

        p.isPaid = true;
        p.freelancer.transfer(p.amount);

        emit PaymentReleased(_id, p.freelancer);
    }

    function getProject(uint _id) public view returns (Project memory) {
        return projects[_id];
    }
}