const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const lodash = require("lodash");
const { default: mongoose, Schema } = require("mongoose");

const { ObjectId } = require("mongoose").Types;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // IMPORTANT - Needed for making POST requests in other coding projects.
app.use(cors()); // IMPORTANT - Needed for running your API and your Code on different server numbers on the same machine

//_____________________MONGODB________________________________

mongoose.connect("mongodb://127.0.0.1:27017/bankApp");

//--------------------Schema creation-------------------

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
  },

  email: {
    type: String,
    required: [true, "Please provide Email id"],
  },

  accounts: [],
});

const accountSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: [true, "Please provide userId"],
  },

  accountBalance: {
    type: Number,
    required: [true, "Please provide an account"],
  },

  accountStartDate: {
    type: Date,
    required: [true, "Please provide a date"],
  },

  loanTaken: {
    type: Boolean,
    required: [false, "loanTaken is Optional"],
  },

  loanAmount: {
    type: Number,
    required: [false, "LoanAmount is optional"],
  },
});

//--------------------Model/Collection creation-------------------

const User = new mongoose.model("user", userSchema);
const Account = new mongoose.model("account", accountSchema);

//_______________________________API_________________________________

app
  .route("/bankApp/api/v1/user")

  .post(async function (req, res) {
    const name = req.body.name;
    const email = req.body.email;

    const newUser = new User({
      name: name,
      email: email,
    });

    try {
      const dataCheck = await User.find({ email: email });

      if (dataCheck.length !== 0)
        return res
          .status(404)
          .json({ success: false, data: "This email already exists" });

      const theData = await newUser.save();

      console.log("True - Post in user worked");
      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log("False - post in user did not work");
      return res.status(400).json({ success: false, data: error });
    }
  })

  .get(async function (req, res) {
    // const email: req.body.email;

    try {
      const theData = await User.find();

      if (theData.length === 0) {
        console.log("False - No user found");
        return res
          .status(404)
          .json({ success: false, data: "No User found with this email id" });
      }

      console.log("True - get for users worked");

      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log("False - get for the user did not work");
      return res.status(400).json({ success: false, data: error });
    }
  });

app
  .route("/bankApp/api/v1/user/:email")

  .get(async function (req, res) {
    const email = req.params.email;

    try {
      const theData = await User.findOne({ email: email });

      if (Object.keys(theData).length === 0) {
        console.log("False - No user found");
        return res
          .status(400)
          .json({ success: false, data: "No User found with this email id" });
      }

      console.log("True - The get user with email worked");

      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log("False - The get user with email did not work");
      return res
        .status(404)
        .json({ success: false, data: "No User found with this email id" });
    }
  })

  .put(async function (req, res) {
    const accountNum = req.body.accountNum;
    const startDate = req.body.startDate;
    const email = req.params.email;

    try {
      const theData = await User.updateOne(
        {
          email: email,
        },
        {
          $push: { accounts: { accountNum: accountNum, startDate: startDate } },
        }
      );

      console.log("True - The put of the user w/ email worked");

      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log("False - the put of the user w/ email did not work");
      return res.status(404).json({ success: false, data: error });
    }
  });

app
  .route("/bankApp/api/v1/account")

  .post(async function (req, res) {
    const userId = req.body.userId;
    const accountBalance = req.body.accountBalance;
    const accountStartDate = req.body.accountStartDate;

    const newAccount = new Account({
      userId: userId,
      accountBalance: accountBalance,
      accountStartDate: accountStartDate,
      loanTaken: false,
      loanAmount: 0,
    });

    try {
      const theData = await newAccount.save();

      console.log("True - The post for account api worked");

      await User.updateOne(
        { _id: userId },
        {
          $push: {
            accounts: {
              accountId: theData.id,
              accountStartDate: accountStartDate,
            },
          },
        }
      );

      console.log("True - The update of the User in the post account worked");

      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log("False - the post for account api did not work");
      return res.status(404).json({ success: false, data: error });
    }
  })

  .get(async function (req, res) {
    try {
      const theData = await Account.find();
      console.log("True - The get api for accounts worked");
      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log("False - the get api for account did not work");
      return res.status(404).json({ success: false, data: error });
    }
  });

app
  .route("/bankApp/api/v1/account/:accountId")

  .get(async function (req, res) {
    const accountId = req.params.accountId;

    try {
      const theData = await Account.findOne({ _id: accountId });

      console.log("True - The get for the accounts with accountId worked");

      return res.status(200).json({ success: true, data: theData });
    } catch (error) {
      console.log(
        "False - The get for the accounts with accountId did not work"
      );
      return res.return(404).json({ success: true, data: error });
    }
  })

  .put(async function (req, res) {
    const accountId = req.params.accountId;
    const type = req.body.type; //withdraw deposit getLoan payLoan
    const loanTaken = req.body.loanTaken;
    const loanAmount = req.body.loanAmount;
    const amount = req.body.amount;

    async function getAccountDetails(numId) {
      try {
        const theData = await Account.findOne({ _id: numId });
        return theData;
      } catch (error) {
        console.log("Issue with the getAccountDetails function");
        return res.status(404).json({ success: false, data: error });
      }
    }

    switch (type) {
      case "getLoan":
        try {
          const theCheck = await getAccountDetails(accountId);

          if (theCheck.loanTaken) {
            return res
              .status(400)
              .json({ success: false, data: "Loan already taken" });
          }

          const theData = await Account.updateOne(
            { _id: accountId },
            {
              loanTaken: true,
              $inc: { loanAmount: loanAmount, accountBalance: loanAmount },
            }
          );

          console.log("True - the getLoan type worked");

          return res.status(200).json({ success: true, data: theData });
        } catch (error) {
          console.log(
            "False - The put for the account type getLoan didn't work"
          );
          return res.status(404).json({ success: false, data: error });
        }

        break;

      case "withdraw":
        try {
          const theCheck = await getAccountDetails(accountId);

          if (theCheck.accountBalance < amount)
            return res.status(400).json({
              success: false,
              data: `Insufficient funds. You currently have ${theCheck.accountBalance}`,
            });

          const theData = await Account.updateOne(
            { _id: accountId },
            { $inc: { accountBalance: -amount } }
          );

          console.log("True - the withdraw type worked.");

          return res.status(200).json({ success: true, data: theData });
        } catch (error) {
          console.log(
            "False - The put for the account type withdraw didn't work"
          );
          return res.status(404).json({ success: false, data: error });
        }
        break;

      case "deposit":
        try {
          const theData = await Account.updateOne(
            { _id: accountId },
            { $inc: { accountBalance: amount } }
          );

          console.log("True - the deposit type worked");

          return res.status(200).json({ success: true, data: theData });
        } catch (error) {
          console.log(
            "False - The put for the account type deposit didn't work"
          );
          return res.status(404).json({ success: false, data: error });
        }
        break;

      case "payLoan":
        try {
          const theCheck = await getAccountDetails(accountId);

          if (theCheck.accountBalance < theCheck.loanAmount)
            return res.status(400).json({
              success: false,
              data: `Insufficient balance to pay loan. Your loan amount is ${theCheck.loanAmount} and your current balance is ${theCheck.accountBalance}`,
            });

          const theData = await Account.updateOne(
            { _id: accountId },
            {
              loanTaken: false,
              $inc: { accountBalance: -theCheck.loanAmount },
              loanAmount: 0,
            }
          );

          return res.status(200).json({ success: true, data: theData });
        } catch (error) {
          console.log(
            "False - The put for the account type payLoan didn't work"
          );
          return res.status(404).json({ success: false, data: error });
        }
        break;

      default:
        res.status(404).json({ success: false, data: "Type not recognised" });
        break;
    }
  });

//___________________LISTEN__________________________________________________

app.listen(port, function () {
  console.log(`The port ${port} is fired up`);
});
