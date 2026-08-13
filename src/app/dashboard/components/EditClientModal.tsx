"use client";

import React from "react";
import { ClientModal, ClientModalProps } from "./ClientModal";

export function EditClientModal(props: any) {
  return (
    <ClientModal
      isOpen={!!props.editingClient}
      mode="edit"
      client={props.editingClient}
      onClose={props.onClose}
      onSave={async (clientData) => {
        if (props.onSave) {
          await props.onSave({ ...props.editingClient, ...clientData });
        }
      }}
      onDelete={props.onDelete}
    />
  );
}

export default EditClientModal;
