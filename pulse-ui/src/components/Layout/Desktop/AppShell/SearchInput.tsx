import { Outlet } from "react-router";
import { TextInput } from "../../../Util/TextInput";

const SearchInput = () => {
  return (
    <div>
      <div className="w-[80%] py-10">
        <TextInput />
      </div>
      <Outlet />
    </div>
  );
};

export default SearchInput;
