const dataConfig = {
  tableName: "cars",
  topK: 5000,
  dbSchema: `CREATE TABLE [cars] (
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
  sampleData: [
    {
      "Name": "chevrolet chevelle malibu",
      "Miles_per_Gallon": 18,
      "Cylinders": 8,
      "Displacement": 307,
      "Horsepower": 130,
      "Weight_in_lbs": 3504,
      "Acceleration": 12,
      "Year": "1970-01-01",
      "Origin": "USA",
    },
    {
      "Name": "buick skylark 320",
      "Miles_per_Gallon": 15,
      "Cylinders": 8,
      "Displacement": 350,
      "Horsepower": 165,
      "Weight_in_lbs": 3693,
      "Acceleration": 11.5,
      "Year": "1970-01-01",
      "Origin": "USA",
    },
    {
      "Name": "plymouth satellite",
      "Miles_per_Gallon": 18,
      "Cylinders": 8,
      "Displacement": 318,
      "Horsepower": 150,
      "Weight_in_lbs": 3436,
      "Acceleration": 11,
      "Year": "1970-01-01",
      "Origin": "USA",
    },
  ],
}

export default dataConfig
