import java.time.LocalDate;
import java.util.Scanner;

public class BankingApp {
    public static void main(String[] args) {
        Bank bank = new Bank("OOP Bank");
        Scanner sc = new Scanner(System.in);

        while (true) {
            System.out.println("\n===== " + bank.getName() + " =====");
            System.out.println("1. Create Account");
            System.out.println("2. Deposit Money");
            System.out.println("3. Withdraw Money");
            System.out.println("4. Check Balance");
            System.out.println("5. Display Account Information");
            System.out.println("6. Print Passbook");
            System.out.println("7. Exit");
            System.out.print("Choose an option: ");
            int choice = sc.nextInt();

            switch (choice) {
                case 1 -> {
                    System.out.print("Enter Account Type (savings/current): ");
                    String type = sc.next();
                    System.out.print("Enter Holder Name: ");
                    sc.nextLine(); // consume newline
                    String name = sc.nextLine();
                    System.out.print("Enter Initial Deposit: ");
                    double deposit = sc.nextDouble();
                    bank.createAccount(type, name, deposit);
                }
                case 2 -> {
                    System.out.print("Enter Account Number: ");
                    int accNo = sc.nextInt();
                    Account acc = bank.getAccount(accNo);
                    if (acc != null) {
                        System.out.print("Enter Amount to Deposit: ");
                        double amt = sc.nextDouble();
                        acc.deposit(amt);
                    } else {
                        System.out.println("❌ Account not found!");
                    }
                }
                case 3 -> {
                    System.out.print("Enter Account Number: ");
                    int accNo = sc.nextInt();
                    Account acc = bank.getAccount(accNo);
                    if (acc != null) {
                        System.out.print("Enter Amount to Withdraw: ");
                        double amt = sc.nextDouble();
                        acc.withdraw(amt);
                    } else {
                        System.out.println("❌ Account not found!");
                    }
                }
                case 4 -> {
                    System.out.print("Enter Account Number: ");
                    int accNo = sc.nextInt();
                    Account acc = bank.getAccount(accNo);
                    if (acc != null) {
                        System.out.println("Balance: ₹" + acc.getBalance());
                    } else {
                        System.out.println("❌ Account not found!");
                    }
                }
                case 5 -> {
                    System.out.print("Enter Account Number: ");
                    int accNo = sc.nextInt();
                    Account acc = bank.getAccount(accNo);
                    if (acc != null) {
                        acc.displayInfo();
                    } else {
                        System.out.println("❌ Account not found!");
                    }
                }
                case 6 -> {
                    System.out.print("Enter Account Number: ");
                    int accNo = sc.nextInt();
                    Account acc = bank.getAccount(accNo);
                    if (acc != null) {
                        acc.printPassbook(null, null); // full passbook
                    } else {
                        System.out.println("❌ Account not found!");
                    }
                }
                case 7 -> {
                    System.out.println("👋 Thank you for banking with us!");
                    sc.close();
                    return;
                }
                default -> System.out.println("❌ Invalid option! Try again.");
            }
        }
    }
}