"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Button, Badge, Chip, Spinner } from "@heroui/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash, Search } from "lucide-react";

const statusColors = {
  active: "success",
  inactive: "danger",
  low: "warning",
} as const;

type ProductStatus = keyof typeof statusColors;

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
};

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "商品名称" },
  { key: "category", label: "分类" },
  { key: "price", label: "价格" },
  { key: "stock", label: "库存" },
  { key: "status", label: "状态" },
  { key: "actions", label: "操作" },
] as const;

export default function ProductManagementPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 模拟 API 请求延迟
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProducts([
          {
            id: 1,
            name: "iPhone 15 Pro",
            category: "手机",
            price: 8999,
            stock: 50,
            status: "active",
          },
          {
            id: 2,
            name: "MacBook Pro",
            category: "电脑",
            price: 15999,
            stock: 30,
            status: "active",
          },
          {
            id: 3,
            name: "AirPods Pro",
            category: "耳机",
            price: 1999,
            stock: 100,
            status: "active",
          },
          {
            id: 4,
            name: "iPad Air",
            category: "平板",
            price: 4999,
            stock: 25,
            status: "inactive",
          },
          {
            id: 5,
            name: "Apple Watch",
            category: "手表",
            price: 3199,
            stock: 75,
            status: "active",
          },
        ]);
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsEditorOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditorOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    console.log("删除产品:", id);
  };

  return (
    <MainLayout>
      {loading ? (
        <div className="flex h-[calc(100vh-140px)] items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="space-y-6 p-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">商品管理</h1>
            <Button
              color="primary"
              onPress={handleAddProduct}
              startContent={<Plus size={18} />}
            >
              添加商品
            </Button>
          </div>

          {/* 搜索栏 */}
          <Card className="border-0 bg-content1 shadow-sm border-default-200">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative w-full max-w-md">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
                  />
                  <Input
                    placeholder="搜索商品..."
                    className="pl-10 bg-default-100 border-default-200 focus:border-primary"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 商品列表 */}
          <Card className="border-0 bg-content1 shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center py-4">
              <h2 className="text-xl font-semibold text-foreground">
                商品列表
              </h2>
              <Badge content={products.length} color="primary" shape="circle">
                <Button variant="flat" color="primary" className="font-medium">
                  全部商品
                </Button>
              </Badge>
            </CardHeader>
            <div className="border-t border-divider" />
            <CardContent>
              <div className="overflow-x-auto pt-4">
                <table className="w-full border-separate border-spacing-y-3 text-sm">
                  <thead>
                    <tr className="text-left text-default-500">
                      {columns.map((column) => (
                        <th key={column.key} className="px-4 py-2 font-medium">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="bg-content2/50 hover:bg-content2 transition-colors shadow-sm"
                      >
                        <td className="px-4 py-4 rounded-l-xl">{product.id}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">
                            {product.name}
                          </div>
                          <p className="text-xs text-default-500">
                            {product.category}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-default-100"
                          >
                            {product.category}
                          </Chip>
                        </td>
                        <td className="px-4 py-4 font-semibold text-foreground">
                          ¥{product.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          {product.stock > 0 ? (
                            <span className="font-medium text-foreground">
                              {product.stock}
                            </span>
                          ) : (
                            <span className="text-danger">缺货</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Chip
                            size="sm"
                            color={statusColors[product.status]}
                            variant="flat"
                          >
                            {product.status === "active" ? "上架" : "下架"}
                          </Chip>
                        </td>
                        <td className="px-4 py-4 rounded-r-xl">
                          <div className="flex gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => handleEditProduct(product)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="danger"
                              onPress={() => handleDeleteProduct(product.id)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-divider py-4">
              <div className="text-small text-default-500">
                共 {products.length} 个商品
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="flat" disabled>
                  上一页
                </Button>
                <Button size="sm" variant="flat" disabled>
                  下一页
                </Button>
              </div>
            </CardFooter>
          </Card>

          {isEditorOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg border-divider bg-background shadow-2xl">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">
                    {selectedProduct ? "编辑商品" : "添加商品"}
                  </h3>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="product-name" className="text-foreground">
                      商品名称
                    </Label>
                    <Input
                      id="product-name"
                      placeholder="请输入商品名称"
                      defaultValue={selectedProduct?.name ?? ""}
                      className="bg-default-100 border-default-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="product-category"
                      className="text-foreground"
                    >
                      商品分类
                    </Label>
                    <Input
                      id="product-category"
                      placeholder="请输入商品分类"
                      defaultValue={selectedProduct?.category ?? ""}
                      className="bg-default-100 border-default-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="product-price"
                        className="text-foreground"
                      >
                        价格
                      </Label>
                      <Input
                        id="product-price"
                        type="number"
                        placeholder="请输入价格"
                        defaultValue={selectedProduct?.price ?? ""}
                        className="bg-default-100 border-default-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="product-stock"
                        className="text-foreground"
                      >
                        库存
                      </Label>
                      <Input
                        id="product-stock"
                        type="number"
                        placeholder="请输入库存"
                        defaultValue={selectedProduct?.stock ?? ""}
                        className="bg-default-100 border-default-200"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-3 pt-6 border-t border-divider mt-2">
                  <Button
                    variant="flat"
                    color="danger"
                    onPress={() => setIsEditorOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => setIsEditorOpen(false)}
                  >
                    保存
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
