import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Users, SlidersHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const SearchBar = () => {
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState(2);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();

  return (
    <div className="w-full bg-card rounded-3xl shadow-elegant border border-border p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Location */}
        <div className="md:col-span-3">
          <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Location
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-11 bg-muted/50 border-0 h-12 rounded-xl focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="md:col-span-2">
          <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Check-in
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-12 bg-muted/50 border-0 rounded-xl hover:bg-muted"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {checkIn ? checkIn.toLocaleDateString() : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Check-out */}
        <div className="md:col-span-2">
          <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Check-out
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-12 bg-muted/50 border-0 rounded-xl hover:bg-muted"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {checkOut ? checkOut.toLocaleDateString() : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests */}
        <div className="md:col-span-2">
          <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Guests
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-12 bg-muted/50 border-0 rounded-xl hover:bg-muted"
              >
                <Users className="mr-2 h-4 w-4" />
                {guests} {guests === 1 ? "guest" : "guests"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Number of Guests</Label>
                  <Slider
                    value={[guests]}
                    onValueChange={(value) => setGuests(value[0])}
                    min={1}
                    max={16}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {guests} {guests === 1 ? "guest" : "guests"}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filters */}
        <div className="md:col-span-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 bg-muted/50 border-0 rounded-xl hover:bg-muted"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Price Range (per night)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={1000}
                    step={10}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Button */}
        <div className="md:col-span-2">
          <Button className="w-full h-12 gradient-hero text-primary-foreground font-semibold shadow-elegant hover:shadow-glow transition-smooth rounded-xl">
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
