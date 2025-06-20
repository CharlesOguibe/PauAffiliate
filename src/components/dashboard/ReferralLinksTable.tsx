
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Copy, LinkIcon, Plus } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { ReferralLink } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferralLinksTableProps {
  referralLinks: Array<ReferralLink & { product: { name: string; price: number; commissionRate: number } }>;
  copiedLinkId: string | null;
  onCopyToClipboard: (code: string, id: string) => void;
}

const ReferralLinksTable = ({ referralLinks, copiedLinkId, onCopyToClipboard }: ReferralLinksTableProps) => {
  if (referralLinks.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <LinkIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Your Referral Links</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          You haven't created any referral links yet. Browse products to start promoting.
        </p>
        <Link to="/affiliate/browse-products">
          <Button variant="outline" size="sm">
            Create First Link
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </GlassCard>
    );
  }

  return (
    <>
      <div className="mt-8">
        <h2 className="text-xl font-medium mb-4">Your Referral Links</h2>
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Referral Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.product.name}</TableCell>
                    <TableCell>{link.product.commissionRate}%</TableCell>
                    <TableCell>{link.clicks}</TableCell>
                    <TableCell>{link.conversions}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {`${window.location.origin}/ref/${link.code}`}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onCopyToClipboard(link.code, link.id)}
                        >
                          {copiedLinkId === link.id ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link to="/affiliate/browse-products" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Browse More Products
          </Button>
        </Link>
      </div>
    </>
  );
};

export default ReferralLinksTable;
