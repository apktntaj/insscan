import { hsCodeFormat, isValidFormat } from "../utils/utility";

export default function Row({ rowCells }) {
  return (
    <td className='px-4'>
      {rowCells
        ? isValidFormat(rowCells)
          ? hsCodeFormat(rowCells)
          : rowCells
        : "null"}
    </td>
  );
}
