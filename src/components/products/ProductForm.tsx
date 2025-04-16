import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Button from "@/components/ui/custom/Button";
import { toast } from "@/hooks/use-toast";
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Define the validation schema for the product form
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  commissionRate: z.coerce.number().min(0).max(100, { message: "Commission rate must be between 0 and 100%" }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  initialValues?: Partial<ProductFormValues>;
  productId?: string;
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  onSuccess,
  onCancel,
  initialValues,
  productId,
  isEditing = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      price: initialValues?.price || undefined,
      commissionRate: initialValues?.commissionRate || 10,
    },
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (!user) {
        throw new Error("You must be logged in to manage products");
      }

      let imageUrl = null;
      if (selectedImage) {
        try {
          const fileExt = selectedImage.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          // Upload image to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, selectedImage, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get the public URL
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          imageUrl = data.publicUrl;
        } catch (error: any) {
          console.error('Error uploading image:', error);
          toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: error.message || "Failed to upload image. Please try again.",
          });
          return;
        }
      }

      if (isEditing && productId) {
        const { data, error } = await supabase
          .from('products')
          .update({
            name: values.name,
            description: values.description,
            price: values.price,
            commission_rate: values.commissionRate,
            image_url: imageUrl || undefined
          })
          .eq('id', productId)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Product Updated",
          description: "Your product has been successfully updated.",
        });

        const updatedProduct: Product = {
          id: data.id,
          businessId: data.business_id,
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.image_url,
          commissionRate: data.commission_rate,
          affiliates: []
        };

        if (onSuccess) {
          onSuccess(updatedProduct);
        }

        // Redirect after successful update
        navigate('/dashboard');

      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              business_id: user.id,
              name: values.name,
              description: values.description,
              price: values.price,
              commission_rate: values.commissionRate,
              image_url: imageUrl
            }
          ])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Product Created",
          description: "Your product has been successfully created.",
        });

        const newProduct: Product = {
          id: data.id,
          businessId: data.business_id,
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.image_url,
          commissionRate: data.commission_rate,
          affiliates: []
        };

        if (onSuccess) {
          onSuccess(newProduct);
        }

        // Redirect after successful creation
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error('Error managing product:', error);
      toast({
        variant: "destructive",
        title: isEditing ? "Failed to update product" : "Failed to create product",
        description: error.message || "An error occurred. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormDescription>
                A clear, descriptive name for your product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your product in detail" 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                A detailed description will help affiliates understand your product better.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₦)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>
                  The selling price of your product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commissionRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0" max="100" placeholder="10" {...field} />
                </FormControl>
                <FormDescription>
                  Percentage commission for affiliates.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Choose Image</label>
          <input type="file" onChange={handleImageChange} className="mt-1 block w-full" />
          {selectedImage && <p className="mt-2 text-sm text-gray-500">Selected file: {selectedImage.name}</p>}
          {imagePreview && <img src={imagePreview} alt="Selected" className="mt-4 w-full h-auto max-w-xs object-contain" />}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText={isEditing ? "Updating Product..." : "Creating Product..."}
          >
            {isEditing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
