// @ts-nocheck
import { React, useState, useEffect } from "react";
import {
  Button,
  EditorToolbarButton,
  TextInput,
  Card,
  FieldGroup,
  FormLabel,
  Textarea,
} from "@contentful/forma-36-react-components";
import { FieldExtensionSDK } from "contentful-ui-extensions-sdk";
import { v4 as uuid } from "uuid";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const WHRepeatableField = (props: FieldProps) => {
  const fieldValue = props.sdk.field.getValue();
  const initialRows = fieldValue
    ? fieldValue.map((value) => ({ ...value, key: uuid() }))
    : [];
  const [rows, setRows] = useState(initialRows);

  // use contentful's builtin auto-resizer
  useEffect(() => {
    props.sdk.window.startAutoResizer();
  }, [props.sdk.window]);

  // update contentful field value whenever rows data changes
  useEffect(() => {
    const sanitizedRows = rows.map((row) => {
      const sanitizedRow = {
        title: row.title,
        image: row.image,
        desc: row.desc,
        cta_link: row.cta_link,
        cta_button_text: row.cta_button_text,
      };
      return sanitizedRow;
    });
    props.sdk.field.setValue(sanitizedRows);
  }, [rows, props.sdk.field]);

  // open entry selection dialog and append selected entries to the end of our list
  const onAddButtonClicked = () => {
    setRows([
      ...rows,
      { key: uuid(), title: "", image: "", desc: "", cta_link: "", cta_button_text: "" },
    ]);
  };
  

  // update fields dynamically
  const onTextChanged = (e) => {
    const rowIndex = e.target.dataset.index;
    const fieldName = e.target.name;
    const updatedRows = [...rows];
    updatedRows[rowIndex][fieldName] = e.target.value;
    setRows(updatedRows);
  };

  // Open contentful image picker to select an existing image
  const onImageChange = async (e) => {
    const rowIndex = e.currentTarget.dataset.index; // Use currentTarget to get the index
    const updatedRows = [...rows]; // Create a copy of the current rows
  
    // Log the rowIndex and the length of updatedRows for debugging
    console.log("rowIndex:", rowIndex);
    console.log("updatedRows length:", updatedRows.length);
  
    try {
      // Open the Contentful asset selection dialog
      const asset = await props.sdk.dialogs.selectSingleAsset({
        accept: 'image/*',
        showAssetDetails: true,
      });
  
      if (asset) {
        // Check if rowIndex is valid
        if (rowIndex >= 0 && rowIndex < updatedRows.length) {
          const assetUrl = asset.fields.file['en-US'].url; // Adjust based on your locale
          // Update the image property in the specific row
          updatedRows[rowIndex].image = {
            sys: {
              id: asset.sys.id,
              linkType: 'Asset',
              type: 'Link',
            },
            url: assetUrl, // Store the asset URL
          };
  
          // Log the updated image for debugging
          console.log("Updated image:", updatedRows[rowIndex].image);
  
          // Update the state with the new rows
          setRows(updatedRows);
        } else {
          console.error("Invalid rowIndex:", rowIndex);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
    }
  };

  // remove row from list
  const onDeleteButtonClicked = (passedRow) => {
    const updatedRows = rows.filter((row) => row !== passedRow);
    setRows(updatedRows);
  };

  // Called when ingredient is re-ordered
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    setRows((prevRows) => {
      const result = Array.from(prevRows);
      const [removed] = result.splice(source.index, 1);
      result.splice(destination.index, 0, removed);
      return result;
    });
  };

  return (
    <section>
      <div>
        <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
          <Droppable droppableId="rows">
            {(provided) => {
              return (
                <div ref={provided.innerRef} className="rows">
                  {rows.map((row, index) => {
                    return (
                      <Draggable
                        key={`${row.key}-${index}`}
                        draggableId={`${row.key}-${index}`}
                        index={index}
                      >
                        {(provided) => {
                          return (
                            <div
                              key={row.key}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              style={{
                                userSelect: "none",
                                ...provided.draggableProps.style,
                              }}
                            >
                              <Card className="row">
                                <div className="form-fields">
                                  {/* Title Text Input */}
                                  <div className="form-field">
                                    <TextInput
                                      value={row.title}
                                      placeholder="Title"
                                      data-index={index}
                                      name="title"
                                      onChange={onTextChanged}
                                    />
                                  </div>

                                  {/* Media Select from Contentful */}
                                  <div className="form-field">
                                    <FieldGroup>
                                      <FormLabel>Image</FormLabel>
                                      {/* Conditionally render the image thumbnail if it exists */}
                                      {rows[index].image && (
                                        <div className="image-thumbnail">
                                          <img
                                            src={rows[index].image.url} // Use the stored URL
                                            alt={rows[index].title} // You can use a relevant title or description
                                            style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px' }} // Adjust styles as needed
                                          />
                                        </div>
                                      )}
                                      <Button onClick={onImageChange} data-index={index}>
                                        Select Image from Contentful
                                      </Button>
                                    </FieldGroup>
                                  </div>

                                  {/* Description Text Input */}
                                  <div className="form-field">
                                    <Textarea
                                      value={row.desc}
                                      placeholder="Description"
                                      data-index={index}
                                      name="desc"
                                      onChange={onTextChanged}
                                    />
                                  </div>

                                  {/* CTA Link Text Input */}
                                  <div className="form-field">
                                    <TextInput
                                      value={row.cta_link}
                                      placeholder="CTA Link (URL)"
                                      data-index={index}
                                      name="cta_link"
                                      onChange={onTextChanged}
                                    />
                                  </div>

                                  {/* CTA Button Text */}
                                  <div className="form-field">
                                    <TextInput
                                      value={row.cta_button_text}
                                      placeholder="CTA Button Text"
                                      data-index={index}
                                      name="cta_button_text"
                                      onChange={onTextChanged}
                                    />
                                  </div>
                                </div>

                                <div className="delete">
                                  <EditorToolbarButton
                                    icon="Delete"
                                    data-index={index}
                                    onClick={() => onDeleteButtonClicked(row)}
                                  />
                                </div>
                              </Card>
                            </div>
                          );
                        }}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              );
            }}
          </Droppable>
        </DragDropContext>
      </div>

      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <Button icon="Plus" buttonType="naked" onClick={onAddButtonClicked}>
          Add
        </Button>
      </div>
    </section>
  );
};

export default WHRepeatableField;