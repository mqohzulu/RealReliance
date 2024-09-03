export interface Account {
    accountID: string;
    accountNumber: string;
    accountType: string;
    activeInd: boolean;
    balance: number;
    personID: string;
    status: boolean ;
  }

  export interface CreateAccountCommand {
    PersonId: string;  
    AccountNumber: string;
    AccountType: string;
    Balance: number;  
    IsClosed: boolean;
    ActiveInd: boolean;
  }