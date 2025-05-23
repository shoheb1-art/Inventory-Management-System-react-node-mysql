const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ims",
});

app.post("/signup", (req, res) => {
  const sql = "INSERT INTO login(`name`,`email`,`password`) VALUES(?)";

  const values = [req.body.name, req.body.email, req.body.password];
  db.query(sql, [values], (err, data) => {
    if (err) {
      return res.json("ERROR");
    }
    return res.json(data);
  });
});

app.post("/login", (req, res) => {
  const sql = "SELECT * from login WHERE `email`=? AND `password`=?";

  db.query(sql, [req.body.email, req.body.password], (err, data) => {
    if (err) {
      return res.json("ERROR");
    }
    if (data.length > 0) {
      return res.json("Success");
    } else {
      return res.json("Failed");
    }
  });
});

// ProductForm.......
app.post("/products/:id", (req, res) => {
  const { name, price, description } = req.body;
  const productId = req.params.id;

  // SQL query to insert data into products table
  const productsSql =
    "INSERT INTO products (productId, name, price, description) VALUES (?, ?, ?, ?)";
  const productsValues = [productId, name, price, description];

  // SQL query to insert data into productdetails table
  const productDetailsSql =
    "INSERT INTO productdetails (productId, ProductName) VALUES (?, ?)";
  const productDetailsValues = [productId, name];

  // SQL query to insert data into userview table
  const userviewSql =
    "INSERT INTO userview (productId, name, price, description) VALUES (?, ?, ?, ?)";
  const userviewValues = [productId, name, price, description];

  // Execute the SQL queries
  db.query(productsSql, productsValues, (productsErr, productsData) => {
    if (productsErr) {
      console.error(productsErr);
      return res
        .status(500)
        .json({ error: "Failed to create/update product in products table" });
    }

    // Insert data into the productdetails table
    db.query(
      productDetailsSql,
      productDetailsValues,
      (productDetailsErr, productDetailsData) => {
        if (productDetailsErr) {
          console.error(productDetailsErr);
          return res
            .status(500)
            .json({ error: "Failed to insert data into productdetails table" });
        }

        // Insert data into the userview table
        db.query(userviewSql, userviewValues, (userviewErr, userviewData) => {
          if (userviewErr) {
            console.error(userviewErr);
            return res.status(500).json({
              error: "Failed to create/update product in userview table",
            });
          }

          return res
            .status(201)
            .json({ message: "Product created/updated successfully" });
        });
      }
    );
  });
});

//  fetching products
app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
    return res.status(200).json(data);
  });
});

//removing products

// Endpoint for removing products
app.delete("/products/:id", (req, res) => {
  const productId = req.params.id;
  const sql = "DELETE FROM products WHERE id = ?";
  db.query(sql, [productId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete product" });
    }
    return res.status(200).json({ message: "Product deleted successfully" });
  });
});

//products-details
app.post("/product-details/:id", (req, res) => {
  const productId = req.params.id;
  const { date, quantity, movementType } = req.body;

  // SQL query to insert data into productDetails table
  const productDetailsSql =
    "INSERT INTO productDetails (productId, date, quantity, movementType) VALUES (?, ?, ?, ?)";
  const productDetailsValues = [productId, date, quantity, movementType];

  // SQL query to insert data into userview table
  const userviewSql =
    "INSERT INTO userview (productId, date, quantity, movementType) VALUES (?, ?, ?, ?)";
  const userviewValues = [productId, date, quantity, movementType];

  // Execute both SQL queries
  db.query(
    productDetailsSql,
    productDetailsValues,
    (productDetailsErr, productDetailsData) => {
      if (productDetailsErr) {
        console.error(productDetailsErr);
        return res.status(500).json({
          error: "Failed to update product details in productDetails table",
        });
      }

      // Insert into userview table only if the product details update in productDetails table is successful
      db.query(userviewSql, userviewValues, (userviewErr, userviewData) => {
        if (userviewErr) {
          console.error(userviewErr);
          return res.status(500).json({
            error: "Failed to update product details in userview table",
          });
        }

        return res
          .status(201)
          .json({ message: "Product details updated successfully" });
      });
    }
  );
});

//To automatically insert the name from the "products" table into the "productName" column of the "productDetails"
app.post("/product-details/:id", (req, res) => {
  const productId = req.params.id;
  const { date, quantity, movementType } = req.body;

  // SQL query to insert data into productDetails table and fetch productName from products table
  const sql = `
    INSERT INTO productDetails (productId, productName, date, quantity, movementType) 
    SELECT ?, name, ?, ?, ?
    FROM products
    WHERE id = ?`;

  // Execute SQL query
  db.query(
    sql,
    [productId, date, quantity, movementType, productId],
    (err, data) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ error: "Failed to update product details" });
      }
      return res
        .status(201)
        .json({ message: "Product details updated successfully" });
    }
  );
});

//fetch from products-details
app.get("/product-details/:id", (req, res) => {
  const sql =
    "SELECT pd.*, p.name AS productName FROM productDetails pd INNER JOIN products p ON pd.productId = p.id";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch product details" });
    }
    return res.status(200).json(data);
  });
});

//userview......................

app.get("/userview", (req, res) => {
  // SQL query to fetch data from userview table
  const sql = "SELECT * FROM userview";

  // Execute the SQL query
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Failed to fetch data from userview table" });
    }

    // Return the fetched data
    return res.status(200).json(data);
  });
});

//for userview and cart
app.get("/products", (req, res) => {
  const query = "SELECT * FROM products";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing MySQL query: " + err.stack);
      res.status(500).json({ error: "Error fetching products" });
      return;
    }

    res.json(results);
  });
});

//logOut.........................
app.post("/logout", (req, res) => {
  // Perform any necessary cleanup tasks (e.g., invalidate tokens)
  res.status(200).json({ message: "Logout successful" });
});

// API endpoint for product search
app.post("/search", (req, res) => {
  const searchTerm = req.body.searchTerm;
  const sql = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

app.listen(8081, () => {
  console.log("listening");
});
