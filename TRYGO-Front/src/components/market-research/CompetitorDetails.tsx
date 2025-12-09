
import { FC } from 'react';
import { ArrowLeft, Globe, Users, DollarSign, MessageSquare, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface SocialLink {
  platform: string;
  url: string;
}

interface CompetitorProps {
  competitor: {
    id: string;
    name: string;
    url: string;
    channels: string[];
    socialLinks: SocialLink[];
    description: string;
    pricing: string[];
    slogans: string[];
    leadMagnets: string[];
    reviews: {
      positive: string[];
      negative: string[];
    };
  };
  onBack: () => void;
}

const CompetitorDetails: FC<CompetitorProps> = ({ competitor, onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    onBack();
    // In case direct navigation happened, ensure we can go back to research page
    if (window.location.pathname !== '/research') {
      navigate('/research');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <Button variant="ghost" onClick={handleBack} className="mb-6 hover:bg-blue-100 flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market Research
      </Button>
      
      <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-200">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{competitor.name}</h1>
            <a 
              href={competitor.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 flex items-center mt-2 hover:underline"
            >
              <Globe className="h-4 w-4 mr-1" /> {competitor.url}
            </a>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            {competitor.channels.map((channel, idx) => (
              <Badge key={idx} variant="outline" className="bg-white">
                {channel}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{competitor.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Social Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-4 w-4 mr-2" /> Social Media Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {competitor.socialLinks.map((link, idx) => (
                <li key={idx}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* Pricing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-4 w-4 mr-2" /> Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {competitor.pricing.map((price, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-400 mr-2"></div>
                  <span>{price}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Marketing Information */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Marketing Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slogans */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" /> Advertising Slogans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {competitor.slogans.map((slogan, idx) => (
                  <li key={idx} className="italic text-gray-700 border-l-4 border-blue-300 pl-3 py-1">
                    "{slogan}"
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Lead Magnets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Star className="h-4 w-4 mr-2" /> Lead Magnets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {competitor.leadMagnets.map((magnet, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-400 mr-2"></div>
                    <span>{magnet}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Reviews */}
      <div>
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Reviews */}
          <Card>
            <CardHeader className="pb-2 bg-green-50">
              <CardTitle className="text-lg flex items-center">
                <ThumbsUp className="h-4 w-4 mr-2 text-green-600" /> Positive Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {competitor.reviews.positive.map((review, idx) => (
                <Alert key={idx} className="mb-3 bg-green-50/50">
                  <AlertTitle className="text-sm font-normal text-green-800">
                    Customer Feedback
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    "{review}"
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
          
          {/* Negative Reviews */}
          <Card>
            <CardHeader className="pb-2 bg-red-50">
              <CardTitle className="text-lg flex items-center">
                <ThumbsDown className="h-4 w-4 mr-2 text-red-600" /> Negative Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {competitor.reviews.negative.map((review, idx) => (
                <Alert key={idx} className="mb-3 bg-red-50/50">
                  <AlertTitle className="text-sm font-normal text-red-800">
                    Customer Feedback
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    "{review}"
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompetitorDetails;
