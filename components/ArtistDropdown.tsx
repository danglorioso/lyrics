import React from 'react';
import AsyncSelect from 'react-select/async';

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
    backgroundColor: '#1f2937',
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

// 👇 Genius API search
const fetchArtists = async (inputValue: string): Promise<OptionType[]> => {
    if (inputValue.length < 3) return [];
  
    const res = await fetch(`/api/search-genius?q=${encodeURIComponent(inputValue)}`);
    const json = await res.json();
    const hits = json.response?.hits || [];
  
    const artistsMap = new Map<string, OptionType>();
    hits.forEach((hit: any) => {
      const artist = hit.result.primary_artist;
      if (!artistsMap.has(artist.id)) {
        artistsMap.set(artist.id, {
          label: artist.name,
          value: artist.id.toString(),
        });
      }
    });
  
    return Array.from(artistsMap.values());
  };  

const ArtistDropdown: React.FC<ArtistDropdownProps> = ({
  selectedArtist,
  setSelectedArtist,
}) => {
  return (
    <AsyncSelect
      cacheOptions
      defaultOptions={false}
      loadOptions={fetchArtists}
      onChange={setSelectedArtist}
      value={selectedArtist}
      placeholder="Search for an artist..."
      styles={customStyles}
    />
  );
};

export default ArtistDropdown;
