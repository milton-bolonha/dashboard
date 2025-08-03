"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { fetchWithWorkspace } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Modal from "@/components/ui/Modal";

export default function MembersPage() {
  const { currentWorkspace, isOwner } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      fetchMembers();
    }
  }, [currentWorkspace]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithWorkspace(
        `/api/workspaces/${currentWorkspace._id}/members`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch members");
      }
      setMembers(data.members);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmationModal = (member) => {
    setMemberToRemove(member);
    setIsConfirmModalOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetchWithWorkspace(
        `/api/workspaces/${currentWorkspace._id}/members/${memberToRemove.userId}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      // Atualizar a lista de membros no estado
      setMembers((prevMembers) =>
        prevMembers.filter((m) => m.userId !== memberToRemove.userId)
      );
      alert("Member removed successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsRemoving(false);
      setIsConfirmModalOpen(false);
      setMemberToRemove(null);
    }
  };

  if (loading) {
    return <div>Loading members...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Members
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage who has access to your workspace.
        </p>
      </div>

      <Card>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <li
              key={member.userId}
              className="py-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <Image
                  src={member.imageUrl || "/images/default-avatar.png"}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                  {member.role}
                </span>
                {isOwner && member.role !== "owner" && (
                  <Button
                    variant="danger-outline"
                    size="sm"
                    onClick={() => openConfirmationModal(member)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {isOwner && (
        <Card title="Invite New Member">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enter the email address of the person you want to invite.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
              />
              <Button>Send Invite</Button>
            </div>
          </div>
        </Card>
      )}

      {isConfirmModalOpen && (
        <Modal
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Member Removal"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-bold">{memberToRemove?.name}</span>
              {" ("}
              <span className="font-mono text-sm">{memberToRemove?.email}</span>
              {")"} from the workspace?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This action is irreversible.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveMember}
                disabled={isRemoving}
              >
                {isRemoving ? "Removing..." : "Yes, remove member"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
