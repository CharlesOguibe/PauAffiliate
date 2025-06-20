
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import ProductCreate from "./pages/ProductCreate";
import ProductDetail from "./pages/ProductDetail";
import ProductEdit from "./pages/ProductEdit";
import AffiliateBrowseProducts from "./pages/AffiliateBrowseProducts";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ReferralRedirect from "./pages/ReferralRedirect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Auth />} />
              <Route path="/auth/register" element={<Auth />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute>
                  <ProductList />
                </ProtectedRoute>
              } />
              <Route path="/products/create" element={
                <ProtectedRoute>
                  <ProductCreate />
                </ProtectedRoute>
              } />
              <Route path="/products/:id" element={
                <ProtectedRoute>
                  <ProductDetail />
                </ProtectedRoute>
              } />
              <Route path="/products/:id/edit" element={
                <ProtectedRoute>
                  <ProductEdit />
                </ProtectedRoute>
              } />
              <Route path="/affiliate/browse-products" element={
                <ProtectedRoute>
                  <AffiliateBrowseProducts />
                </ProtectedRoute>
              } />
              <Route path="/ref/:code" element={<ReferralRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
