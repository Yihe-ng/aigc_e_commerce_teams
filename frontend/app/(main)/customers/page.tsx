"use client"

import { Card } from "@heroui/react"

export default function CustomersPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <Card variant="secondary" className="p-6">
        <Card.Header>
          <Card.Title>客户概览</Card.Title>
          <Card.Description>占位页：会员、优惠券、触达任务等模块可在此展开</Card.Description>
        </Card.Header>
      </Card>
    </div>
  )
}
