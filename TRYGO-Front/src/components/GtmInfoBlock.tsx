import { FC } from "react";
import { Input } from "./ui/input";
import { Check, X } from "lucide-react";
import { ChannelsType } from "@/api/getHypothesesGtm";

type Props = {
  value: string;
  title: string
  isEditing: boolean,
  editingField: keyof ChannelsType
  editName: string;
  setEditName: React.SetStateAction<any>;
  handleSave: (value: string, field: keyof ChannelsType) => void;
  handleCancel: () => void;
  handleClick: () => void;
};

const GtmInfoBlock: FC<Props> = ({
  value,
  isEditing,
  editingField,
  title,
  editName,
  setEditName,
  handleSave,
  handleCancel,
  handleClick,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 relative bg-white">
        <h4 className="font-medium text-lg text-blue-600 mb-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
          {title}
        </h4>

        <div className="space-y-1">
          <div className="flex items-center group hover:bg-blue-50 p-1 rounded cursor-pointer">
            {isEditing ? (
              <div className="space-y-2 w-full">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Channel name"
                  className="py-1 text-sm w-full"
                />

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave(editName, editingField)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700" onClick={handleClick}>
                  {value}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
  );
};

export default GtmInfoBlock;
