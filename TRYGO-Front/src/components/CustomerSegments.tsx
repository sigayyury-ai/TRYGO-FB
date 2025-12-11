import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Expand } from 'lucide-react';

interface CustomerSegment {
  name: string;
  description: string;
  id: string
}

interface CustomerSegmentsProps {
  initialSegments: CustomerSegment[];
  onSegmentsChange: (segments: CustomerSegment[]) => void;
}

const CustomerSegments: FC<CustomerSegmentsProps> = ({
  initialSegments,
  onSegmentsChange,
}) => {
  const [segments, setSegments] = useState<CustomerSegment[]>(initialSegments);
  const navigate = useNavigate();

  useEffect(() => {
    setSegments(initialSegments);
  }, [initialSegments]);

  const handleViewSegments = () => {
    navigate('/segments');
  };

  return (
    <div>
      <div className='space-y-1'>
        {segments.length > 0 ? (
          segments.map((segment) => (
            <div key={segment.id} className='flex items-center'>
              <span className='text-gray-800'>{segment.name}</span>
            </div>
          ))
        ) : (
          <p className='text-gray-500 text-sm'>
            No customer segments defined yet.
          </p>
        )}
      </div>

      <Button
        variant='outline'
        size='sm'
        className='mt-3 text-blue-500 border-blue-300 hover:bg-blue-50 mr-2'
        onClick={handleViewSegments}
      >
        <Expand className='h-3.5 w-3.5 mr-1' /> View/Edit All Segments
      </Button>
    </div>
  );
};

export default CustomerSegments;
