

export interface Person {
    PersonId: string;
    IdNumber: string;
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber?: string;
    Address?: string;
    DateOfBirth: Date;
    ActiveInd: boolean;
  }
  export interface CreatePersonCommand {
    idNumber: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    activeInd: boolean;
    dateOfBirth: string; // Should be in a format parseable by C# DateTime
  }