import { cls } from "@/lib/utils";
import { TextAreaInputProps } from "./input.type";

function TextInput(props: TextAreaInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }

    // Reset field height
    (e.target as HTMLTextAreaElement).style.height = "inherit";

    // Get the computed styles for the element
    const computed = window.getComputedStyle(e.target as Element);

    // Calculate the height
    const height =
      parseInt(computed.getPropertyValue("border-top-width"), 10) +
      parseInt(computed.getPropertyValue("padding-top"), 10) +
      (e.target as HTMLTextAreaElement).scrollHeight +
      parseInt(computed.getPropertyValue("padding-bottom"), 10) +
      parseInt(computed.getPropertyValue("border-bottom-width"), 10);

    (e.target as HTMLTextAreaElement).style.height = `${height}px`;
  };

  return (
    <textarea
      {...props.register}
      id={props.name}
      placeholder={props.placeholder ? props.placeholder : ""}
      defaultValue={props.defaultValue ? props.defaultValue : ""}
      readOnly={props.disabled as boolean}
      autoComplete="off"
      rows={1}
      onInput={
        props.onInput as
          | React.InputEventHandler<HTMLTextAreaElement>
          | undefined
      }
      disabled={props.disabled}
      onKeyDown={(e) => {
        handleKeyDown(e);
        props.onKeyDown && props.onKeyDown(e);
      }}
      className={cls(
        "relative w-full border-none bg-transparent break-word outline-none resize-none",
        "text-gray-900 dark:text-white", //text
        props.disabled
          ? "placeholder:text-gray-200 dark:placeholder:text-gray-700"
          : "",
        props.placeholder
          ? "placeholder:text-gray-300 dark:placeholder:text-gray-600"
          : "",
        //custom
        props.className ? props.className : "",
      )}
    />
  );
}
export default TextInput;
