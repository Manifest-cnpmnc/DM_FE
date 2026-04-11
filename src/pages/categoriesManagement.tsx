import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Tag, Loader2, X, Info } from "lucide-react";
import axios from "axios";
import "../styles/register.css";

const API_BASE_URL = "http://localhost:8080/api/categories";

interface Category {
  id: number;
  name: string;
  description: string;
}

const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Category[]>(API_BASE_URL);
      setCategories(response.data);
    } catch (error) {
      console.error("Error when loading categories:", error);
      alert("Cannot load category list. Please check the server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        //  API PUT: /api/categories/{id}
        await axios.put(`${API_BASE_URL}/${editingCategory.id}`, formData);
      } else {
        // API POST: /api/categories
        await axios.post(API_BASE_URL, formData);
      }
      setIsModalOpen(false);
      fetchCategories(); // Refresh
    } catch (error) {
      console.error("Error when saving category:", error);
      alert("Error saving data. Please check again!");
    }
  };

  // 3. (DELETE)
  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`${API_BASE_URL}/${id}`);
        fetchCategories(); // Refresh
      } catch (error) {
        alert("Error when deleting. This category might be in use!");
      }
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="rap-root">
      <nav className="rap-nav">
        <div className="rap-nav__brand">DOCU-MANAGE</div>
        <button className="rap-nav__signin" onClick={() => handleOpenModal()}>
          <Plus size={18} style={{ marginRight: "8px" }} />
          New Category
        </button>
      </nav>

      <main
        className="rap-main"
        style={{ flexDirection: "column", alignItems: "stretch" }}
      >
        <div className="rap-form__header" style={{ marginBottom: "32px" }}>
          <h1 className="rap-form__title">Document Categories</h1>
          <p className="rap-form__subtitle">
            Data is synchronized directly with the PostgreSQL Database.
          </p>
        </div>

        <div
          className="rap-form"
          style={{
            maxWidth: "100%",
            padding: "0",
            overflow: "hidden",
            minHeight: "200px",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "50px",
                color: "var(--rap-navy)",
              }}
            >
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead
                style={{
                  background: "var(--rap-surface-2)",
                  borderBottom: "1px solid var(--rap-border)",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "16px 24px",
                      fontSize: "0.8rem",
                      color: "var(--rap-light)",
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      fontSize: "0.8rem",
                      color: "var(--rap-light)",
                    }}
                  >
                    Tên danh mục
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      fontSize: "0.8rem",
                      color: "var(--rap-light)",
                    }}
                  >
                    Mô tả
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      fontSize: "0.8rem",
                      color: "var(--rap-light)",
                      textAlign: "right",
                    }}
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      style={{ borderBottom: "1px solid var(--rap-border)" }}
                    >
                      <td style={{ padding: "16px 24px", fontWeight: 600 }}>
                        #{cat.id}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <Tag size={16} color="var(--rap-navy-mid)" />
                          <span
                            style={{
                              fontWeight: 700,
                              color: "var(--rap-navy)",
                            }}
                          >
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 24px",
                          color: "var(--rap-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {cat.description}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className="rap-actions__link"
                          style={{ marginRight: "16px" }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="rap-actions__link"
                          style={{ color: "#b91c1c" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--rap-light)",
                      }}
                    >
                      No categories available. Click "New Category" to create one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL FORM  */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(13, 31, 60, 0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rap-form"
            style={{ width: "450px", animation: "rap-fadeUp 0.3s ease" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 className="rap-form__title" style={{ fontSize: "1.5rem" }}>
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--rap-light)",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rap-form__grid"
              style={{ gridTemplateColumns: "1fr", marginTop: "10px" }}
            >
              <div className="rap-field">
                <label className="rap-field__label">Category Name</label>
                <input
                  className="rap-field__input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Regulations"
                  required
                />
              </div>

              <div className="rap-field">
                <label className="rap-field__label">Description</label>
                <textarea
                  className="rap-field__input"
                  style={{
                    height: "100px",
                    padding: "12px 18px",
                    resize: "none",
                  }}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What kind of documents belong here?"
                />
              </div>

              <div className="rap-notice">
                <Info size={18} className="rap-notice__icon" />
                <div className="rap-notice__body">
                  Categories help Team 3 organize metadata efficiently without
                  touching physical files.
                </div>
              </div>

              <div
                className="rap-actions"
                style={{ marginTop: "10px", justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rap-actions__link"
                >
                  Cancel
                </button>
                <button type="submit" className="rap-actions__primary">
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
