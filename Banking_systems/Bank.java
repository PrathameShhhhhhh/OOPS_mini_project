import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

// Transaction class for passbook entries
class Transaction {
    private LocalDateTime date;
    private String type;
    private double amount;
    private double balance;

    public Transaction(String type, double amount, double balance) {
        this.date = LocalDateTime.now();
        this.type = type;
        this.amount = amount;
        this.balance = balance;
    }

    public LocalDateTime getDate() {
        return date;
    }

    @Override
    public String toString() {
        return date + " | " + type + " | ₹" + amount + " | Balance: ₹" + balance;
    }
}

// Abstract Account class
abstract class Account {
    private static int counter = 1001;
    private int accountNumber;
    private String holderName;
    protected double balance;
    protected List<Transaction> transactions;

    public Account(String holderName, double initialDeposit) {
        this.accountNumber = counter++;
        this.holderName = holderName;
        this.balance = initialDeposit;
        this.transactions = new ArrayList<>();
        addTransaction("OPEN", initialDeposit);
    }

    public int getAccountNumber() {
        return accountNumber;
    }

    public String getHolderName() {
        return holderName;
    }

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        balance += amount;
        addTransaction("DEPOSIT", amount);
        System.out.println("₹" + amount + " deposited. New Balance: ₹" + balance);
    }

    public abstract void withdraw(double amount);

    protected void addTransaction(String type, double amount) {
        transactions.add(new Transaction(type, amount, balance));
    }

    public void printPassbook(LocalDate from, LocalDate to) {
        System.out.println("\n--- PASSBOOK ---");
        for (Transaction t : transactions) {
            LocalDate transDate = t.getDate().toLocalDate();
            if ((from == null || !transDate.isBefore(from)) && 
                (to == null || !transDate.isAfter(to))) {
                System.out.println(t);
            }
        }
        System.out.println("----------------");
    }

    public void displayInfo() {
        System.out.println("Account No: " + accountNumber);
        System.out.println("Holder Name: " + holderName);
        System.out.println("Balance: ₹" + balance);
    }
}

// Savings Account with daily withdrawal limit
class SavingsAccount extends Account {
    private double dailyLimit;
    private double withdrawnToday;
    private LocalDate today;

    public SavingsAccount(String holderName, double initialDeposit, double dailyLimit) {
        super(holderName, initialDeposit);
        this.dailyLimit = dailyLimit;
        this.withdrawnToday = 0;
        this.today = LocalDate.now();
    }

    @Override
    public void withdraw(double amount) {
        LocalDate now = LocalDate.now();
        if (!now.equals(today)) {
            withdrawnToday = 0;
            today = now;
        }

        if (amount > balance) {
            System.out.println("❌ Insufficient balance!");
        } else if ((withdrawnToday + amount) > dailyLimit) {
            System.out.println("❌ Withdrawal limit exceeded for today!");
        } else {
            balance -= amount;
            withdrawnToday += amount;
            addTransaction("WITHDRAW", amount);
            System.out.println("₹" + amount + " withdrawn. Remaining Balance: ₹" + balance);
        }
    }
}

// Current Account (no daily limit)
class CurrentAccount extends Account {
    public CurrentAccount(String holderName, double initialDeposit) {
        super(holderName, initialDeposit);
    }

    @Override
    public void withdraw(double amount) {
        if (amount > balance) {
            System.out.println("❌ Insufficient balance!");
        } else {
            balance -= amount;
            addTransaction("WITHDRAW", amount);
            System.out.println("₹" + amount + " withdrawn. Remaining Balance: ₹" + balance);
        }
    }
}

// Bank class to manage multiple accounts
public class Bank {
    private String name;
    private HashMap<Integer, Account> accounts;

    public Bank(String name) {
        this.name = name;
        this.accounts = new HashMap<>();
    }

    public String getName() {
        return name;
    }

    public Account createAccount(String type, String holderName, double deposit) {
        Account acc;
        if (type.equalsIgnoreCase("savings")) {
            acc = new SavingsAccount(holderName, deposit, 20000);
        } else {
            acc = new CurrentAccount(holderName, deposit);
        }
        accounts.put(acc.getAccountNumber(), acc);
        System.out.println("✅ " + type + " account created. Account Number: " + acc.getAccountNumber());
        return acc;
    }

    public Account getAccount(int accountNumber) {
        return accounts.get(accountNumber);
    }
}