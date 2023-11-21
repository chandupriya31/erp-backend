const Product = require('../models/product-model')
const { uploadToS3 } = require('../middlewares/image-upload')
const { validationResult } = require('express-validator')
const _ = require('lodash')
const Company = require('../models/company-model')
const productCltr = {}

productCltr.create = async (req, res) => {
   const errors = validationResult(req)
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
   }
   const body = req.body
   try {
      const filesData = req.files // using multer for file uploads
      let images = []
      // uplaoding to AWS  
      for (const file of filesData) {
         const uploadResult = await uploadToS3(file)
         images.push(uploadResult)
         //console.log(upload)
      }
      body.image = images
      const product = new Product(body)
      await product.save()
      await Company.findOneAndUpdate({ _id: product.companyId }, { $push: { products: product._id } })
      res.json(product)
   } catch (error) {
      console.error("Error creating product:", error)
      res.status(500).json(error.message)
   }
}

productCltr.list = async (req, res) => {
   try {
      const product = await Product.find()
      res.json(product)
   } catch (e) {
      res.status(500).json(e)
   }
}

productCltr.category = async (req, res) => {
   const id = req.params.id
   try {
      // Assuming 'Product' model has a field 'categoryId' referencing the category ID
      const products = await Product.find({ categoryId: id }).populate('categoryId')
      res.json(products)
   } catch (e) {
      res.status(500).json(e.message)
   }
}

productCltr.delete = async (req, res) => {
   const productId = req.params.id
   try {
      const productExist = await Product.findById(productId)
      if (!productExist) {
         return res.status(404).json({ error: 'product not found' })
      }
      await Product.findByIdAndDelete(productId)
      res.status(200).json({ productExist, message: 'product deleted successfully' })
   } catch (error) {
      res.status(500).json({ error: 'internal server error' })
   }
}

// productCltr.update = async (req, res) => {
//    const errors = validationResult(req)

//    if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() })
//    }

//    const productId = req.params.id
//    const body = req.body

//    try {
//       const existingProduct = await Product.findById(productId)
//       if (!existingProduct) {
//          return res.status(404).json({ error: 'Product not found' })
//       }

//       // Update productname if provided in the request body
//       if (body.productname) {
//          existingProduct.productname = body.productname
//       }

//       // Handle image update if a new image is provided
//       if (req.files && req.files.length > 0) {
//          const uploadedImage = req.files[0] // Assuming only one image is uploaded

//          // Delete existing image from S3
//          if (existingProduct.imageKey) {
//             await deleteFromS3(existingProduct.image.key)
//          }

//          // Upload new image to S3
//          const { key, url } = await uploadToS3(uploadedImage)

//          // Update product with new image details
//          existingProduct.image.Key = key
//          existingProduct.image.Url = url
//       }

//       // Save the updated product to the database
//       const updatedProduct = await existingProduct.save()

//       res.status(200).json(updatedProduct)
//    } catch (error) {
//       console.error(error)
//       res.status(500).json({ error: 'Internal Server Error' })
//    }
// }

// productCltr.update = async (req, res) => {
//    const errros = validationResult(req)
//    if (!errros.isEmpty()) {
//       return res.status(400).json({ errros: errros.array() })
//    }
//    const id = req.params.id
//    const body = req.body
//    try {
//       const product = await Product.findByIdAndUpdate(id, body, { new: true })
//       product.save()
//       res.json(product)
//    } catch (e) {  
//       res.status(500).json(e)
//    }
// }

module.exports = productCltr