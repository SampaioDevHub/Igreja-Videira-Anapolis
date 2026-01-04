"use client"

import { Button, Empty, List, Modal, Space, Typography } from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import { NotificationModalProps } from "@/src/core/@types/props/NotificationModalProps"

export function NotificationModal({
  open,
  onClose,
  notifications,
  onDelete,
}: NotificationModalProps) {
  return (
    <Modal
      title="Notificacoes recentes"
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
    >
      {notifications.length === 0 ? (
        <Empty description="Nenhuma notificacao recente" />
      ) : (
        <List
          dataSource={notifications}
          itemLayout="horizontal"
          renderItem={(notif, index) => (
            <List.Item
              actions={[
                <Button
                  key={`delete-${index}`}
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(index)}
                  aria-label="Excluir notificacao"
                />,
              ]}
            >
              <List.Item.Meta
                title={<Typography.Text strong>{notif.title}</Typography.Text>}
                description={
                  <Space direction="vertical" size={0}>
                    <Typography.Text type="secondary">{notif.body}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                      {notif.date}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  )
}
