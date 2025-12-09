import { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, X, Check, Link as LinkIcon, Expand, Rocket } from "lucide-react";
import { ChannelDto, ChannelType } from "@/api/getHypothesesCore";
import { useNavigate } from "react-router-dom";

interface Channel {
  name: string;
  url: string;
}

interface ChannelsListProps {
  initialChannels: ChannelDto[];
  onChannelsChange: (channels: ChannelDto[]) => void;
}

const getChannelTypeDisplayName = (channelType: ChannelType): string => {
  // Return the channel type as is, without translation
  return channelType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const ChannelsList: FC<ChannelsListProps> = ({
  initialChannels,
  onChannelsChange,
}) => {
  const [channels, setChannels] = useState<ChannelDto[]>(initialChannels);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editUrl, setEditUrl] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>("");
  const [newChannelUrl, setNewChannelUrl] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  const updateChannelsAndNotify = (updatedChannels: ChannelDto[]) => {
    setChannels(updatedChannels);
    onChannelsChange(updatedChannels);
  };


  const handleViewChannels = () => {
    navigate('/channels');
  };

  const handleViewGTM = () => {
    navigate('/gtm');
  };


  // const handleEditStart = (index: number) => {
  //   setEditingIndex(index);
  //   setEditName(channels[index].name);
  //   setEditUrl(channels[index].url);
  // };

  // const handleEditCancel = () => {
  //   setEditingIndex(null);
  //   setEditName('');
  //   setEditUrl('');
  // };

  // const handleEditSave = () => {
  //   if (editingIndex !== null && editName.trim() && editUrl.trim()) {
  //     const newChannels = [...channels];
  //     newChannels[editingIndex] = { name: editName, url: editUrl };
  //     updateChannelsAndNotify(newChannels);
  //     setEditingIndex(null);
  //     setEditName('');
  //     setEditUrl('');
  //   }
  // };

  // const handleAddChannel = () => {
  //   if (newChannelName.trim() && newChannelUrl.trim()) {
  //     const newChannels = [
  //       ...channels,
  //       { name: newChannelName, url: newChannelUrl },
  //     ];
  //     updateChannelsAndNotify(newChannels);
  //     setNewChannelName('');
  //     setNewChannelUrl('');
  //     setIsAdding(false);
  //   }
  // };

  // const handleRemoveChannel = (index: number) => {
  //   const newChannels = channels.filter((_, i) => i !== index);
  //   updateChannelsAndNotify(newChannels);
  // };

  return (
    <div className="space-y-3 ">
      <ol className="list-decimal pl-5 space-y-2">
        {channels.length === 0 && !isAdding ? (
          <p className="text-gray-500 text-sm">No channels defined yet.</p>
        ) : (
          channels.map(({ channelType, variants }, channelIndex) => (
            <li key={channelIndex} className="text-gray-800">
              <div className="flex items-center justify-between group">
                <p className="text-gray-800 font-medium">
                  {getChannelTypeDisplayName(channelType)}
                </p>
              </div>
            </li>
          ))
          // channels.map((channel, index) => (
          //   <li key={index} className='text-gray-800'>
          //     {editingIndex === index ? (
          //       <div className='space-y-2'>
          //         <Input
          //           value={editName}
          //           onChange={(e) => setEditName(e.target.value)}
          //           placeholder='Channel name'
          //           className='py-1 text-sm'
          //         />
          //         <Input
          //           value={editUrl}
          //           onChange={(e) => setEditUrl(e.target.value)}
          //           placeholder='https://example.com'
          //           className='py-1 text-sm'
          //         />
          //         <div className='flex space-x-2'>
          //           <button
          //             onClick={handleEditSave}
          //             className='text-green-600 hover:text-green-800'
          //           >
          //             <Check className='h-4 w-4' />
          //           </button>
          //           <button
          //             onClick={handleEditCancel}
          //             className='text-red-600 hover:text-red-800'
          //           >
          //             <X className='h-4 w-4' />
          //           </button>
          //         </div>
          //       </div>
          //     ) : (
          //       <div className='flex items-center justify-between group'>
          //         <a
          //           href={channel.url}
          //           target='_blank'
          //           rel='noopener noreferrer'
          //           className='flex items-center text-blue-500 hover:text-blue-700'
          //         >
          //           {channel.name} <LinkIcon className='h-3 w-3 ml-1' />
          //         </a>
          //         <div className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center'>
          //           <button
          //             onClick={() => handleEditStart(index)}
          //             className='text-blue-500 hover:text-blue-700 mr-1'
          //           >
          //             <Pencil className='h-3.5 w-3.5' />
          //           </button>
          //           <button
          //             onClick={() => handleRemoveChannel(index)}
          //             className='text-red-500 hover:text-red-700'
          //           >
          //             <X className='h-3.5 w-3.5' />
          //           </button>
          //         </div>
          //       </div>
          //     )}
          //   </li>
          // ))
        )}
      </ol>

      <div className="flex gap-2 flex-col">
        <Button 
          variant='outline'
          size='sm'
          className='text-blue-500 border-blue-300 hover:bg-blue-50'
          onClick={handleViewChannels}
        >
          <Expand className='h-3.5 w-3.5 mr-1' /> View/Edit All Channels
        </Button>
        
        <Button
          variant='outline'
          size='sm'
          className='text-green-600 border-green-300 hover:bg-green-50'
          onClick={handleViewGTM}
        >
          <Rocket className='h-3.5 w-3.5 mr-1' /> View GTM
        </Button>
      </div>

      {/* {isAdding ? (
        <div className='space-y-2 mt-2'>
          <Input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder='Channel name'
            className='py-1 text-sm'
          />
          <Input
            value={newChannelUrl}
            onChange={(e) => setNewChannelUrl(e.target.value)}
            placeholder='https://example.com'
            className='py-1 text-sm'
          />
          <div className='flex space-x-2'>
            <button
              onClick={handleAddChannel}
              className='text-green-600 hover:text-green-800'
            >
              <Check className='h-4 w-4' />
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className='text-red-600 hover:text-red-800'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>
      ) : (
        <Button
          variant='outline'
          size='sm'
          className='text-blue-500 border-blue-300 hover:bg-blue-50'
          onClick={() => setIsAdding(true)}
        >
          <Plus className='h-3.5 w-3.5 mr-1' /> Add channel
        </Button>
      )} */}
    </div>
  );
};

export default ChannelsList;
