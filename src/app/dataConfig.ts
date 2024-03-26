interface Config {
  [key: string]: string
}

const schemas: Config = {
  cars: `CREATE TABLE [cars] (
  [Name] TEXT,
  [Miles_per_Gallon] REAL NULL,
  [Cylinders] INT,
  [Displacement] REAL,
  [Horsepower] INT NULL,
  [Weight_in_lbs] INT,
  [Acceleration] REAL,
  [Year] TEXT,
  [Origin] TEXT
);`,
  titanic: `CREATE TABLE titanic(
  "PassengerId" TEXT,
  "Survived" TEXT,
  "Pclass" TEXT,
  "Name" TEXT,
  "Sex" TEXT,
  "Age" TEXT,
  "SibSp" TEXT,
  "Parch" TEXT,
  "Ticket" TEXT,
  "Fare" TEXT,
  "Cabin" TEXT,
  "Embarked" TEXT
);`,
}

export const options = [
  { value: "Cars.db", label: "Cars" },
  { value: "titanic.db", label: "Titanic Passengers" },
]

export default schemas
