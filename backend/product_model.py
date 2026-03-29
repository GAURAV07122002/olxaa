class Product:
    def __init__(self, id, name, description, price):
        self.id = id
        self.name = name
        self.description = description
        self.price = price

class ProductModel:
    def __init__(self):
        self.products = []

    def create_product(self, product):
        self.products.append(product)
        return product

    def read_product(self, product_id):
        for product in self.products:
            if product.id == product_id:
                return product
        return None

    def update_product(self, product_id, updated_product):
        for index, product in enumerate(self.products):
            if product.id == product_id:
                self.products[index] = updated_product
                return updated_product
        return None

    def delete_product(self, product_id):
        for index, product in enumerate(self.products):
            if product.id == product_id:
                del self.products[index]
                return True
        return False

    def filter_products(self, **filters):
        filtered = self.products
        for key, value in filters.items():
            filtered = [p for p in filtered if getattr(p, key) == value]
        return filtered

# Example Usage:
# product_model = ProductModel()
# product_model.create_product(Product(1, 'Product A', 'Description A', 10.0))
# product_model.create_product(Product(2, 'Product B', 'Description B', 15.0))

