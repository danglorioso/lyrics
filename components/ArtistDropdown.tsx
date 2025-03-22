import React from 'react';
import Select from 'react-select';

export type OptionType = {
  label: string;
  value: string;
};

interface ArtistDropdownProps {
  selectedArtist: OptionType | null;
  setSelectedArtist: (option: OptionType | null) => void;
}

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: '#1f2937', // dark gray
    borderColor: state.isFocused ? '#8b5cf6' : '#4b5563',
    boxShadow: state.isFocused ? '0 0 0 1px #8b5cf6' : 'none',
    '&:hover': {
      borderColor: '#8b5cf6',
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#1f2937',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#8b5cf6' : '#1f2937',
    color: state.isFocused ? '#fff' : '#d1d5db',
    '&:hover': {
      backgroundColor: '#8b5cf6',
      color: '#fff',
    },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#d1d5db',
  }),
};

const ArtistDropdown: React.FC<ArtistDropdownProps> = ({
  selectedArtist,
  setSelectedArtist,
}) => {
  // Dummy artist options
  const options: OptionType[] = [
    { value: 'artist1', label: 'Artist One' },
    { value: 'artist2', label: 'Artist Two' },
    { value: 'artist3', label: 'Artist Three' },
  ];

  return (
    <div>
      <Select
        value={selectedArtist}
        onChange={setSelectedArtist}
        options={options}
        placeholder="Select an artist..."
        styles={customStyles}
      />
    </div>
  );
};

export default ArtistDropdown;
