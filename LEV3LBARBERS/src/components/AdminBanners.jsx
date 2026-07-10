import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../utils/api";
import ConfirmModal from "../modals/ConfirmModal";
import { ImageIcon, PencilIcon, TrashIcon, PlusIcon } from "../common/icons.jsx";

const INK = "#1a1a1a";
const RED = "#C41E3A";

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState({ message: "", page: "", imageUrl: "" });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ message: "", page: "", imageUrl: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded, setExpanded] = useState("active"); // default open

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get("/banners/all-banners");
      setBanners(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch banners", err);
    }
  };

  const addBanner = async () => {
    if (!newBanner.message.trim()) return alert("Enter a banner message");
    try {
      await api.post("/banners/add-message", newBanner);
      setNewBanner({ message: "", page: "", imageUrl: "" });
      fetchBanners();
    } catch (err) {
      console.error("Failed to add banner", err);
    }
  };

  const handleDeleteBanner = async (id) => {
    try {
      await api.delete(`/banners/delete-banner/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete banner", err);
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await api.put(`/banners/edit-banner/${id}`, { active: !active });
      fetchBanners();
    } catch (err) {
      console.error("Failed to update banner", err);
    }
  };

  const startEditing = (banner) => {
    setEditingId(banner.id);
    setEditValues({ message: banner.message, page: banner.page, imageUrl: banner.imageUrl || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ message: "", page: "", imageUrl: "" });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/banners/edit-banner/${id}`, editValues);
      fetchBanners();
      setEditingId(null);
    } catch (err) {
      console.error("Failed to edit banner", err);
    }
  };

  const grouped = {
    active: banners.filter((b) => b.active),
    inactive: banners.filter((b) => !b.active),
  };

  return (
    <FormCard>
      <PanelTitle>Manage Banner Messages</PanelTitle>

      {/* Add new banner */}
      <CategoryContent>
        <Label>
          Message
          <Input
            placeholder="Enter banner message..."
            value={newBanner.message}
            onChange={(e) =>
              setNewBanner({ ...newBanner, message: e.target.value })
            }
          />
        </Label>

        <Label>
          Page
          <Input
            placeholder="e.g. signup, rewards"
            value={newBanner.page}
            onChange={(e) =>
              setNewBanner({ ...newBanner, page: e.target.value })
            }
          />
        </Label>

        <Label>
          Image URL
          <Input
            placeholder="https://example.com/logo.png"
            value={newBanner.imageUrl}
            onChange={(e) =>
              setNewBanner({ ...newBanner, imageUrl: e.target.value })
            }
          />
        </Label>


        <SaveButton onClick={addBanner}>
          <PlusIcon width={14} height={14} /> Add Banner
        </SaveButton>
      </CategoryContent>

      {/* Grouped lists */}
      {["active", "inactive"].map((status) => {
        const isOpen = expanded === status;
        const list = grouped[status];

        return (
          <CategoryBlock key={status}>
            <CategoryHeader
              onClick={() => setExpanded(isOpen ? null : status)}
            >
              <span>
                {status === "active" ? "Active Banners" : "Inactive Banners"}
              </span>
              <ToggleIcon>{isOpen ? "−" : "+"}</ToggleIcon>
            </CategoryHeader>

            {isOpen && (
              <CategoryContent>
                <RewardList>
                  {list.length === 0 && (
                    <EmptyText>
                      No {status === "active" ? "active" : "inactive"} banners.
                    </EmptyText>
                  )}
                  {list.map((b) => (
                    <RewardItem key={b.id}>
                      {editingId === b.id ? (
                        <>
                          <Input
                            value={editValues.message}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                message: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Page"
                            value={editValues.page}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                page: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Image URL"
                            value={editValues.imageUrl}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                imageUrl: e.target.value,
                              })
                            }
                          />

                          <SaveButtonSmall onClick={() => saveEdit(b.id)}>
                            Save
                          </SaveButtonSmall>
                          <CancelButton onClick={cancelEdit}>
                            Cancel
                          </CancelButton>
                        </>
                      ) : (
                        <>
                          <BannerContent>
                            {b.imageUrl ? (
                              <img src={b.imageUrl} alt="banner logo" />
                            ) : (
                              <ImageIcon width={18} height={18} style={{ flexShrink: 0, opacity: 0.45 }} />
                            )}
                            <span>
                              {b.message}{" "}
                              {b.page && <em style={{ color: RED }}>→ {b.page}</em>}
                            </span>
                          </BannerContent>
                          <div>
                            <EditButton onClick={() => startEditing(b)}>
                              <PencilIcon width={14} height={14} /> Edit
                            </EditButton>
                            <DeleteButton onClick={() => setDeleteTarget(b)}>
                              <TrashIcon width={14} height={14} /> Delete
                            </DeleteButton>
                            <SaveButtonSmall
                              onClick={() => toggleActive(b.id, b.active)}
                            >
                              {b.active ? "Deactivate" : "Activate"}
                            </SaveButtonSmall>
                          </div>
                        </>
                      )}
                    </RewardItem>
                  ))}
                </RewardList>
              </CategoryContent>
            )}
          </CategoryBlock>
        );
      })}

      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete "${deleteTarget.message}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteBanner(deleteTarget.id)}
        />
      )}
    </FormCard>
  );
};

export default AdminBanners;

/* --- Styled Components (cream/ink/red theme) --- */

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.55);
  padding: 2rem;
  border: 1px solid rgba(26, 26, 26, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${INK};
`;

const CategoryBlock = styled.div`
  margin-top: 1rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(26, 26, 26, 0.08);
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background: rgba(26, 26, 26, 0.05);
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${INK};
  font-weight: bold;
`;

const ToggleIcon = styled.span`
  font-size: 1.5rem;
  color: ${INK};
`;

const CategoryContent = styled.div`
  padding: 1rem;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  color: ${RED};
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Input = styled.input`
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26, 26, 26, 0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  outline: none;

  &::placeholder {
    color: rgba(26, 26, 26, 0.35);
  }

  &:focus {
    border-color: ${RED};
  }
`;

const RewardList = styled.div`
  margin-top: 1rem;
`;

const RewardItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.08);
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;

  div {
    display: flex;
    gap: 0.5rem;
  }
`;

const BannerContent = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Montserrat', sans-serif;
  color: ${INK};

  img {
    height: 24px;
    flex-shrink: 0;
  }
`;


const ButtonBase = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 1.2;
  text-align: center;
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover {
    transform: scale(1.03);
  }
`;

const SaveButton = styled(ButtonBase)`
  background: ${RED};
  color: #fff;

  &:hover {
    background: #a8182f;
  }
`;

const SaveButtonSmall = styled(SaveButton)`
  min-width: auto;
  padding: 0.4rem 0.75rem;
`;

const EditButton = styled(ButtonBase)`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.55);

  &:hover {
    background: rgba(26, 26, 26, 0.05);
    color: ${INK};
  }
`;

const DeleteButton = styled(ButtonBase)`
  background: transparent;
  border: 1px solid ${RED};
  color: ${RED};

  &:hover {
    background: rgba(196, 30, 58, 0.08);
  }
`;

const CancelButton = styled(ButtonBase)`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.55);

  &:hover {
    color: ${INK};
    background: rgba(26, 26, 26, 0.05);
  }
`;

const EmptyText = styled.div`
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: rgba(26, 26, 26, 0.5);
  font-style: italic;
  margin-top: 0.5rem;
`;
