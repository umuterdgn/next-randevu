import api from "./client";

export const getProducts = async () => {
  const response = await api.get("/business/products");
  return response.data;
};

export const addProduct = async (productData) => {
  const response = await api.post("/business/products", productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/business/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/business/products/${id}`);
  return response.data;
};
