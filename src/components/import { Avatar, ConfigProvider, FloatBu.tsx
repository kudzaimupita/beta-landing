import { Avatar, ConfigProvider, FloatButton, Splitter, Tag, Tooltip, message, theme } from 'antd';
import { BsDatabaseFillX, BsEye, BsPencilSquare, BsPlusSquare } from 'react-icons/bs';
import { BuilderPrimitiveTypes, BuilderPrimitivesProvider } from './ComponentsLib/builderPrimitiveTypes';
import { HiZoomIn, HiZoomOut } from 'react-icons/hi';
import { KeepScale, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import Moveable, { MoveableManagerInterface } from 'react-moveable';
import { PiCursorFill, PiPencilDuotone } from 'react-icons/pi';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RedoOutlined, UndoOutlined } from '@mui/icons-material';
import _, { isEmpty } from 'lodash';
import {
    addCommentReply,
    deleteComment,
    getComments,
    resolveComment,
    storeComment,
    updateComment,
} from '@/services/comments';
import {
    calculateCursorPosition,
    calculateNewTransform,
    clampPosition,
    createNewItem,
    findIndexToInsert,
    findMaxRightEdge,
    findNearestElement,
    findNearestGroup,
    getNextZIndex,
    getQueryParams,
    isGroupMovingIntoItself,
    parseTransform2,
    updateElementsWithNewItem,
    updateTransformRotation,
} from './utils/builderUtils';
import { getPosition, getPosition2 } from '@/utils/getPosition';
import { getScaleValue, getTopOffset } from './utils/scale';
import { initializeControlBoxPositioning, updateControlBoxPosition } from './Moveable/ControlBoxDynoPosition';
import store, { DragAndDropState, refreshAppAuth, setDestroyInfo, setSessionInfo } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { CiViewTimeline } from 'react-icons/ci';
import DOMFlowDiagram from './DOMDiagram';
import DeviceFrameWrapper from './DeviceFrameWrapper';
import ElementRenderer from '../Builder/lib/RenderElements';
import { FaUser } from 'react-icons/fa';
import FitScreen from '@fit-screen/react';
import { FloatingComment } from './Comments/commentEditor';
import FlowBuilder from './customFlowBuilder';
import { GroupManager } from '@moveable/helper';
import InlineEditText from './lib/InLineTextEditor';
import LayersPanel from './LayersPanel';
import { MdCenterFocusStrong } from 'react-icons/md';
import RightMenu from './RighMenu';
import Selecto from 'react-selecto';
import { UserOutlined } from '@ant-design/icons';
import { deepFlat } from '@daybrush/utils';
import { setAppStatePartial } from '@/store/slices/appState';
import { storeInvocation } from '@/services/invocationService';
import { updateObjectById } from './utils/updateComponentByIdInArray';
import useDrawing from '../Mail/componentLibrary/DrawComponent/Util/useDraw';
import useWebSocketPresence from './userWebsocket';

// import SchemaERD, { sampleTables } from './Inspector/ERDViewer';

// import { Badge } from 'rizzui';

// import FigmaLikeEditor from './fabric';

const validTags = [
    'input',
    'img',
    'br',
    'hr',
    'area',
    'base',
    'col',
    'embed',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];
interface BuilderProps {
    application: any;
    items?: any[];
    allComponents: any[];
    onItemEdit?: (action: string, item: any) => void;
    allComponentsRaw: any[];
    setItemToEdit: (item: any) => void;
    handleSaveLayout: (layout: any) => void;
    Editor: React.ReactNode;
    parentStyle?: React.CSSProperties;
    setCreateViewDialogIsOpen: (isOpen: boolean) => void;
    parentConfig: any;
}
interface Element {
    i: string;
    style: React.CSSProperties;
    isGroup?: boolean;
    children?: string[];
    parent?: string | null;
    configuration?: {
        zIndex?: string;
        [key: string]: any;
    };
    [key: string]: any;
}
export const Builder: React.FC<BuilderProps> = ({
    application,
    setunresolvedCommentCount,
    setresolvedCommentCount,
    reviewMode,
    setReviewMode,
    items = [],
    allComponents,
    onItemEdit,
    allComponentsRaw,
    setItemToEdit,
    handleSaveLayout,
    Editor,
    parentStyle,
    setCreateViewDialogIsOpen,
    parentConfig,
    itemToEdit,
    loading,
    domInspectorOpen,
    editMode,
    setEditMode,
}) => {
    delete parentStyle?.position;

    const [isDrawingPathActive, setIsDrawingPathActive] = useState(false);
    const [activeDrawingPathId, setActiveDrawingPathId] = useState(null);
    const [builderCursorMode, setBuilderCursorMode] = useState<'default' | 'hand' | 'draw' | 'path'>('default');
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const { tab, setting, id } = useParams();
    const groupManager = useMemo(() => new GroupManager([]), []);
    const [targets, setTargets] = useState([]);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [PanelSizes, setPanelSizes] = useState<(number | string)[]>(['8%', '70%', '15%']);
    const [isDroppingInContainerBounds, setIsDroppingInContainerBounds] = useState(false);
    const appState = useSelector((state) => state.appState);
    const { currentId, instanceId, width, instanceName, height, mediaType, mediaExtension } = useSelector(
        (state: DragAndDropState) => state.dragAndDrop
    );
    const containerRef = useRef(null);
    const containerRef2 = useRef(null);
    const user = useSelector((state) => state.auth.user);
    useEffect(() => {
        if (!reviewMode) {
            setBuilderCursorMode('default');
            setCommentPos(null);
        } else {
            setBuilderCursorMode('comment');
        }
        // setBuilderCursorMode('comment')
        return () => {
            // second
        };
    }, [reviewMode]);

    const handleDragStart = (e) => {
        // console.log(!elements?.find((el) => el.i === e.target.id));
        if (e.target.id && !elements?.find((el) => el.i === e.target.id)) {
            // message.error('lll');
            e?.stop();
            return;
        }
        const target = e.target;

        target.dataset.originalZIndex = target.style.zIndex;
        // Set to highest z-index + 1
        target.style.zIndex = 9999999;
        setIsDragging(true);
    };
    const [messages, setMessages] = useState<string[]>([]);
    // const [activeUsers, setActiveUsers] = useState([]);
    const currentUser = {
        name: 'kyda',
        id: 'kj',
    };
    const { activeUsers, sendMessage, connectionState } = useWebSocketPresence(user, tab, id);

    const onWarp = (e) => {
        const {
            target,
            transform,
            transformOrigin,
            delta: [dtx, dty],
            direction,
        } = e;

        // Preserve existing transform
        const currentTransform = target.style.transform || window.getComputedStyle(target).transform;

        // Remove existing warp/translate
        const cleanTransform = currentTransform
            .replace(/matrix3d\([^)]*\)/, '')
            .replace(/translate\([^)]*\)/, '')
            .trim();

        // Combine existing transform with warp
        target.style.transform = `${cleanTransform} ${transform}`.trim();
        target.style.transformOrigin = transformOrigin;
    };
    const [scale, setScale] = useState(40);
    useEffect(() => {
        if (targets?.length === 1) {
            if (setItemToEdit.i === targets[0]?.id) return;
            const el = elements?.find((item) => item.i === targets[0]?.id);
            setItemToEdit(el);
        } else {
            setItemToEdit({});
        }
    }, [targets]);
    const handleDragEnd = (e) => {
        const target = e.target;
        // e.target
        target.style.zIndex = target.dataset.originalZIndex || '';
        // Remove the temporary data attribute
        delete target.dataset.originalZIndex;
        setIsDragging(false);
        setDraggingElement(null);
        handleDragStop(e);
    };
    const useUndoRedo = (initialState) => {
        const [states, setStates] = useState([initialState]);
        const [currentIndex, setCurrentIndex] = useState(0);
        const push = useCallback(
            (newState) => {
                const currentState = states[currentIndex];
                if (!_.isEqual(currentState, newState)) {
                    setStates((prev) => [...prev.slice(0, currentIndex + 1), newState]);
                    setCurrentIndex((prev) => prev + 1);
                }
            },
            [currentIndex, states]
        );
        const undo = useCallback(() => {
            if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
                return states[currentIndex - 1];
            }
        }, [currentIndex, states]);
        const redo = useCallback(() => {
            if (currentIndex < states.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                return states[currentIndex + 1];
            }
        }, [currentIndex, states]);
        const reset = useCallback(() => {
            setStates([initialState]);
            setCurrentIndex(0);
        }, [initialState]);
        return {
            currentState: states[currentIndex],
            push,
            undo,
            redo,
            reset,
            canUndo: currentIndex > 0,
            canRedo: currentIndex < states.length - 1,
        };
    };
    const [elements, setElements] = useState<Element[]>(items || []);
    const { push, undo, redo, canUndo, canRedo, reset } = useUndoRedo(elements);

    function collectNestedElements(selectedElements, allElements) {
        const elementsMap = new Map(allElements.map((el) => [el.i, el]));
        const collected = new Set();
        const result = [];

        function addElement(el) {
            if (!el || collected.has(el.i)) return;
            collected.add(el.i);
            result.push(el);

            // Add both types of children:
            // 1. Children listed in the parent's children array
            if (el.children) {
                el.children.forEach((childId) => {
                    const child = elementsMap.get(childId);
                    if (child) addElement(child);
                });
            }

            // 2. Children that reference this element as parent
            const childrenByParent = allElements.filter((e) => e.parent === el.i);
            childrenByParent.forEach((child) => addElement(child));
        }

        selectedElements.forEach((el) => addElement(el));
        return result;
    }
    const [isFocused, setIsFocused] = useState(false);
    const [isBuilderActive, setIsBuilderActive] = useState(false);
    const [comments, setComments] = useState<Document[]>([]);
    const [refreshData, setrefreshData] = useState<any>();
    const fetchData = async () => {
        getComments({ limit: 500 }, {})
            .then((res) => {
                // message.info(res?.results?.length);
                setunresolvedCommentCount(res?.results?.filter((item) => (item?.status !== 'resolved') & !item?.parentComment));
                setresolvedCommentCount(res?.results?.filter((item) => item?.status === 'resolved' && !item?.parentComment));
            })
            .catch((er) => {
                message.error('Error fetching applications');
            });
        getComments({ targetId: tab, limit: 500 }, {})
            .then((res) => {
                setComments(
                    (
                        res as {
                            results: Document[];
                        }
                    ).results
                );
                // message.info(res?.results?.length);
                setunresolvedCommentCount(
                    res?.results?.filter((item) => (item?.status !== 'resolved') & !item?.parentComment)?.length || 0
                );
                setresolvedCommentCount(
                    res?.results?.filter((item) => item?.status === 'resolved' && !item?.parentComment)?.length || 0
                );
            })
            .catch((er) => {
                message.error('Error fetching applications');
            });
    };
    useEffect(() => {
        if (true) {
            fetchData();
        }
    }, [tab, refreshData]);
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            // Check if click is inside builder
            if (containerRef.current?.contains(e.target as Node)) {
                setIsBuilderActive(true);
            } else {
                setIsBuilderActive(false);
            }
        };

        // Handle clicks outside to deactivate builder
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle shortcuts if builder is active
            if (!isBuilderActive) return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    const prevState = undo();
                    if (prevState && canUndo) {
                        // message.info('kkkkkkk');
                        setElements(prevState);
                        setTargets([]);
                    }
                }
                if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    const nextState = redo();
                    if (nextState && canRedo) {
                        setElements(nextState);
                        setTargets([]);
                    }
                }
                if (e.key === 'x') {
                    e.preventDefault();
                    const selectedElements = targets?.map((it) => elements?.find((item) => item.i === it.id));
                    const elementsToCopy = collectNestedElements(selectedElements, elements);
                    navigator.clipboard
                        .writeText(JSON.stringify(elementsToCopy))
                        .then(() => {
                            setElements((prev) => prev.filter((el) => !targets.some((target) => target.id === el.i)));
                            setSelectedTargets([]);
                            setTargets([]);
                        })
                        .catch((err) => console.error('Failed to copy text: ', err));
                }
                if (e.key === 'c') {
                    e.preventDefault();
                    const selectedElements = targets?.map((it) => elements?.find((item) => item.i === it.id));
                    const elementsToCopy = collectNestedElements(selectedElements, elements);
                    navigator.clipboard
                        .writeText(JSON.stringify(elementsToCopy))
                        .catch((err) => console.error('Failed to copy text: ', err));
                }
                if (e.key === 'v') {
                    e.preventDefault();
                    navigator.clipboard.readText().then((text) => {
                        try {
                            const copiedElements = JSON.parse(text);
                            if (!copiedElements?.length) return;

                            const originalElements = elements.filter((el) => copiedElements.some((copied: Element) => copied.i === el.i));

                            const baseOffset = 10;
                            let offsetX = baseOffset;

                            if (originalElements.length > 0) {
                                const maxRight = findMaxRightEdge(originalElements);
                                const canvasMaxRight = findMaxRightEdge(elements);
                                offsetX = canvasMaxRight > maxRight ? baseOffset : maxRight - canvasMaxRight + baseOffset;
                            }

                            const idMap = new Map();
                            let baseId = Date.now();
                            let counter = 0;

                            const newElements = copiedElements.map((el: Element) => {
                                const newId = `${baseId}-${counter++}`;
                                idMap.set(el.i, newId);

                                const originalEl = originalElements.find((e) => e.i === el.i);
                                const originalTransform = originalEl
                                    ? parseTransform2(originalEl.style.transform)
                                    : parseTransform2(el.style.transform);
                                const width = parseInt(originalEl?.style.width || el.style.width) || 0;

                                return {
                                    ...el,
                                    i: newId,
                                    name: `${el.name}-copy`,
                                    parent: el.parent ? idMap.get(el.parent) || null : null,
                                    children: el.children ? el.children.map((childId) => idMap.get(childId)) : [],
                                    style: {
                                        ...el.style,
                                        transform: `translate(${originalTransform.x + offsetX}px, ${originalTransform.y}px)`,
                                        width: `${width}px`,
                                    },
                                };
                            });

                            setElements((prev) => [...prev, ...newElements]);
                            navigator.clipboard.writeText('').then((text) => { });
                        } catch (error) {
                            console.error('Paste failed:', error);
                        }
                    });
                }
            }
            if (e.key === 'Delete') {
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [elements, targets, undo, redo, isBuilderActive]);

    const [savingComment, setSavingComment] = useState(false);

    const handleSaveComment = async (text, type) => {
        setSavingComment(true);
        await storeComment({
            content: text,
            targetType: type,
            targetId: tab,
            position: { x: commentPos.x, y: commentPos.y },
            status: 'open',
        }).then(() => {
            fetchData();
            setCommentPos(null);
        });
        setSavingComment(false);
        // setrefreshData(Date.now());
    };

    const handleUndo = () => {
        // message.info('kkk');
        const prevState = undo();
        if (prevState) setElements(prevState);
    };

    const handleRedo = () => {
        const nextState = redo();
        if (nextState) setElements(nextState);
    };

    const handleElementChange = (newElements: Element[]) => {
        setElements(newElements);
        push(newElements);
    };

    useEffect(() => {
        setTimeout(() => {
            reset();
        }, 50);
    }, [tab]);

    useEffect(() => {
        if (true) {
            handleElementChange(elements);
            handleSaveLayout(elements);
        }
    }, [elements]);

    useEffect(() => {
        const isDifferent = items.some((item) => {
            const matchingElement = elements.find((element) => element.i === item.i);
            return !matchingElement || JSON.stringify(matchingElement) !== JSON.stringify(item);
        });
        if (true) {
            handleElementChange(items);
            setElements(items);
        }
    }, [items]);

    const [pointTo, setPointTo] = useState({});
    const moveableRef = useRef(null);
    const selectoRef = useRef(null);
    const [groups, setGroups] = useState({});

    const componentsMap = useMemo(() => {
        return allComponents?.reduce((map, component) => {
            if (component?.value) {
                map[component.value] = component.config?.component;
            }
            return map;
        }, {});
    }, [allComponents]);

    const getRelativeCoordinates = (e) => {
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - containerRect.left) / (scale / 100);
        const y = (e.clientY - containerRect.top) / (scale / 100);
        return {
            x,
            y,
        };
    };
    const gridSize = 20;

    const GridLines = ({ gridColor = 'rgba(200, 200, 200, 0.2)', gridSize = 20 }) => {
        return (
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 9999999,
                    background: `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          `,
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                }}
            />
        );
    };

    // import React, { useState, useRef, useLayoutEffect } from 'react';
    const ScaleContainer = ({ designWidth = 1440, designHeight = 900, children, className = '', style }) => {
        // Use useRef instead of state to avoid re-renders
        const scaleRef = useRef(1);
        const positionRef = useRef({ x: 0, y: 0 });
        const containerRef = useRef(null);

        // Function for calculating dimensions
        // const calculateDimensions = useCallback(() => {
        //   const viewportWidth = window.innerWidth;
        //   const viewportHeight = window.innerHeight;

        //   const newScale = viewportWidth / designWidth;
        //   const scaledHeight = designHeight * newScale;
        //   const y = Math.max(0, (viewportHeight - scaledHeight) / 2);

        //   return { scale: newScale, position: { x: 0, y } };
        // }, [designWidth, designHeight]);

        // Handle resize without state updates
        // const handleResize = useCallback(() => {
        //   if (!containerRef.current) return;

        //   const { scale, position } = calculateDimensions();
        //   scaleRef.current = scale;
        //   positionRef.current = position;

        //   // Apply transform directly to the DOM element
        //   containerRef.current.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
        // }, [calculateDimensions]);

        // Set up the resize handler only once
        // useEffect(() => {
        //   // Initial resize
        //   handleResize();

        //   // Set up event listener
        //   window.addEventListener('resize', handleResize);

        //   // Clean up
        //   return () => {
        //     window.removeEventListener('resize', handleResize);
        //   };
        // }, [handleResize]);

        return (
            <div className="fixed inset-0 overflow-hidden">
                <div
                    // ref={containerRef}
                    className={`absolute ${className}`}
                    style={
                        {
                            // ...style,
                            // width: `${designWidth}px`,
                            // height: `${designHeight}px`,
                            // transformOrigin: '0 0',
                        }
                    }
                >
                    {children}
                </div>
            </div>
        );
    };
    //
    // export default ScaleContainer;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') {
                setIsShiftPressed(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Shift') {
                setIsShiftPressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isShiftPressed]);
    const setSelectedTargets = useCallback(
        (nextTargets) => {
            selectoRef.current?.setSelectedTargets(deepFlat(nextTargets));
            setTargets(nextTargets);
        },
        [isDrawingPathActive]
    );
    const dispatch = useDispatch();
    useEffect(() => {
        const elements = selectoRef.current?.getSelectableElements();
        groupManager.set([], elements);
    }, []);
    const Guidelines = {
        name: 'guidelines',
        props: [],
        events: [],
        render(moveable: MoveableManagerInterface<any, any>) {
            const rect = moveable.getRect();
            const controlBox = moveable;
            const elWidth = rect.width || 0;
            const elHeight = rect.height || 0;

            return (
                // <KeepScale>
                <div
                    key="guidelines"
                    className="moveable-guidelines dimension-guideline flex h-fit w-fit
            z-50 flex items-center gap-2 px-2 py-1.5 text-xs font-medium bg-blue-500/90 
            text-white rounded-md shadow-sm backdrop-blur-sm
            "
                    style={{
                        position: 'absolute',
                        top: `${elHeight + getTopOffset(scale) - 10}px`,
                        right: `${elWidth / 2}px`,
                        left: `${(elWidth - 120) / 2}px`,
                        bottom: `${elHeight + 30}px`,
                        pointerEvents: 'none',
                        transform: `scale(${getScaleValue(scale)})`,
                        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: Math.round(rect.width) > 0 ? 1 : 0,
                    }}
                >
                    <div className="flex gap-2 text-xs">
                        <span className="flex gap-1">
                            W: <span className="font-bold">{Math.round(rect.width)}</span>
                        </span>
                        <span className="text-blue-200">x</span>
                        <span className="flex gap-1">
                            H: <span className="font-bold">{Math.round(rect.height)}</span>
                        </span>
                    </div>
                </div>
                // </KeepScale>
            );
        },
    } as const;

    const snapToAngle = (angle) => {
        const step = 15;
        return Math.round(angle / step) * step;
    };
    const handleResizeStop = (e) => {
        const target = e.target;
        const itemId = target.id;

        // Get the actual transform values
        // const rect = target.getBoundingClientRect();

        //  message.info(target.style.width)
        // message.info(currentX); // This should now show the actual X position

        const style = {
            width: `${target.style.width}`,
            height: `${target.style.height}`,
            // transform: `translate(${currentX}px, ${currentY}px)`,
        };

        setElements((elements) =>
            elements.map((el) => {
                if (el.i === itemId) {
                    return {
                        ...el,
                        style: {
                            ...el.style,
                            ...style,
                        },
                    };
                }
                return el;
            })
        );

        setIsResizing(false);
    };
    const ensureParentChildConsistency = (elements) => {
        // First, create a map of all elements with their current children
        const elementMap = new Map(
            elements.map((el) => [
                el.i,
                {
                    ...el,
                    children: el.children ? [...el.children] : [],
                },
            ])
        );

        // Filter out elements with invalid parent references
        const cleanedElements = Array.from(elementMap.values()).filter((element) => {
            // Keep elements that either have no parent or have a valid parent
            return !element.parent || elementMap.has(element.parent);
        });

        // Recreate map with cleaned elements
        const cleanedMap = new Map(cleanedElements.map((el) => [el.i, el]));

        // Create new map for storing updated children arrays
        const updatedChildren = new Map(Array.from(cleanedMap.entries()).map(([id, el]) => [id, [...(el.children || [])]]));

        // Go through all elements and check their parent properties
        cleanedElements.forEach((element) => {
            if (element.parent && cleanedMap.has(element.parent)) {
                const currentChildren = updatedChildren.get(element.parent);
                if (!currentChildren.includes(element.i)) {
                    updatedChildren.set(element.parent, [...currentChildren, element.i]);
                }
            }
        });

        // Convert map back to array and ensure children arrays are unique
        return Array.from(cleanedMap.values()).map((element) => ({
            ...element,
            children: [...new Set(updatedChildren.get(element.i) || [])].filter(
                (childId) => cleanedMap.has(childId) && cleanedMap.get(childId).parent === element.i
            ),
        }));
    };

    const handleDragStop = (e) => {
        const target = e.target;
        const itemId = target.id;
        const zoomScale = scale / 100;
        const prevElementTransform = elements?.find((item) => item.i === itemId)?.style?.transform;
        const ogElement = elements?.find((item) => item.i === itemId);
        const initialTransform = target.style.transform || '';
        const computedStyle = window.getComputedStyle(target);
        const position = computedStyle.position;

        // Enhanced click vs drag detection
        const transformMatch = initialTransform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
        let isJustClick = true;
        let prevX = 0,
            prevY = 0;
        if (prevElementTransform) {
            const prevMatch = prevElementTransform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
            if (prevMatch) {
                [, prevX, prevY] = prevMatch.map(Number);
            }
        }

        // Get current position
        let currentX = 0,
            currentY = 0;
        if (transformMatch) {
            [, currentX, currentY] = transformMatch.map(Number);

            // Calculate total movement from previous position
            const deltaX = currentX - prevX;
            const deltaY = currentY - prevY;
            const movement = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

            if (movement < 1) {
                return;
            }

            isJustClick = false;
        }

        const groups = elements.filter(
            (el) => el.isGroup && el.configuration?.pointerEvents !== 'none' && !validTags.includes(el.configuration?.tag)
        );
        const point = {
            x: e.clientX,
            y: e.clientY,
        };
        const newParentGroup = findNearestGroup(point, groups, itemId);

        // Prevent moving group into itself with more robust check
        if (newParentGroup && isGroupMovingIntoItself(newParentGroup, itemId, elements)) {
            return;
        }

        // Helper function to recursively update zIndex for children
        const updateChildrenZIndex = (childrenIds, elementsArray, incrementBy) => {
            return elementsArray.map((element) => {
                // First check if this is one of the children we need to update
                if (childrenIds.includes(element.i)) {
                    // Update the z-index for this child
                    const newElement = {
                        ...element,
                        configuration: {
                            ...element.configuration,
                            zIndex: (element.configuration?.zIndex || 0) + incrementBy,
                        },
                    };

                    // If this child has its own children, recursively update them
                    if (newElement.children && newElement.children.length > 0) {
                        // The key fix: we need to pass the child IDs of this element
                        const updatedElementsArray = updateChildrenZIndex(newElement.children, elementsArray, incrementBy);

                        // Keep the same children reference structure
                        return {
                            ...newElement,
                            // We don't need to filter and map here - that was causing the issue
                            children: newElement.children,
                        };
                    }

                    return newElement;
                }

                return element;
            });
        };
        setElements((prev) => {
            const cleanPrev = prev.filter((el) => el?.i !== undefined);
            const draggedElement = cleanPrev.find((el) => el.i === itemId);

            if (!draggedElement) {
                return cleanPrev;
            }

            const oldParentId = draggedElement.parent;
            const newParentId = newParentGroup?.i || null;

            const newTransform = !isJustClick
                ? calculateNewTransform(target, oldParentId, newParentGroup, containerRef.current, zoomScale)
                : initialTransform;

            // First, create the initial state update without zIndex changes
            let elementsAfterBasicUpdates = cleanPrev.map((element) => {
                const el = { ...element };

                if (el.i === itemId) {
                    const zIndex = getNextZIndex(newParentGroup || elements?.find((ite) => ite.i === ogElement.parent), cleanPrev, el);

                    const updatedElement = {
                        ...el,
                        configuration: {
                            ...el.configuration,
                            ...(zIndex && { zIndex }),
                        },
                        parent: newParentId,
                        isChild: !!newParentId,
                    };

                    if (newParentGroup?.componentId === 'containers-flex' || newParentGroup?.componentId === 'containers-grid') {
                        if (target && !isJustClick) {
                            target.style.transform = '';
                            target.style.position = '';
                        }
                    } else {
                        updatedElement.style = {
                            ...el.style,
                            transform: newTransform,
                        };
                    }
                    return updatedElement;
                }

                if (el.i === oldParentId) {
                    return {
                        ...el,
                        children: (el.children || []).filter((childId) => childId !== undefined).filter((childId) => childId !== itemId),
                    };
                }
                if (el.i === newParentId) {
                    return {
                        ...el,
                        children: [...(el.children || []).filter((childId) => childId !== undefined), itemId],
                    };
                }
                return el;
            });

            // Then, handle zIndex updates if necessary
            if (newParentGroup?.i !== oldParentId) {
                const elementToUpdate = elementsAfterBasicUpdates.find((el) => el.i === itemId);
                if (elementToUpdate?.children?.length > 0) {
                    const incrementBy = 1;
                    // message.error(newZIndex);
                    if (incrementBy !== 0) {
                        // message.error('k')
                        elementsAfterBasicUpdates = updateChildrenZIndex(
                            elementToUpdate.children,
                            elementsAfterBasicUpdates,
                            incrementBy
                        );
                    }
                }
            }

            // Handle flex/grid container insertion
            if (
                !isJustClick &&
                (newParentGroup?.componentId === 'containers-flex' ||
                    (newParentGroup?.componentId === 'containers-grid' && itemId === draggedElement.i))
            ) {
                const insertDirection = newParentGroup?.configuration?.vertical ? 'vertical' : 'horizontal';
                const insertData = findIndexToInsert(cleanPrev, point, insertDirection, scale);

                if (insertData?.index !== undefined) {
                    if (insertData?.type !== 'direct' && insertData?.element?.i !== itemId) {
                        const elementToMove = elementsAfterBasicUpdates.find((el) => el?.i === itemId);
                        elementsAfterBasicUpdates = elementsAfterBasicUpdates.filter((el) => el?.i !== undefined && el.i !== itemId);
                        elementsAfterBasicUpdates.splice(insertData.index, 0, elementToMove);
                        setTargets([]);
                    }
                }
            }

            const fixedElements = ensureParentChildConsistency(elementsAfterBasicUpdates);
            return fixedElements.filter((el) => el?.i !== undefined);
        });
    };
    const [currentDragPoint, setCurrentDragPoint] = useState({});
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [placeholderPos, setPlaceholderPos] = useState({
        x: 0,
        y: 0,
    });
    const handleDelete = () => {
        if (targets.length === 0) {
            // message.error('no items');
            return;
        }
        const targetIds = targets.map((target) => target.id);
        const deleteElements = (elements, idsToDelete) => {
            return elements.filter((element) => {
                if (idsToDelete.includes(element.i)) return false;
                return true;
            });
        };
        setElements((prevElements) => {
            const newElements = deleteElements(prevElements, targetIds);
            targetIds.forEach((id) => {
                onItemEdit?.('delete', {
                    i: id,
                });
            });
            setSelectedTargets([]);
            setTargets([]);
            return newElements;
        });
        setTargets([]);
    };

    const handleDragOver2 = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDraggingOver) {
                setIsDraggingOver(true);
            }
            const container = containerRef2.current;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            // const zoomScale = scale / 100;
            // const relativePos = calculateCursorPosition(e.clientX, e.clientY, containerRect, scale);
            const scaledPos = {
                x: e.clientX,
                y: e.clientY,
            };
            setCurrentDragPoint(scaledPos);
            const clampedPos = clampPosition(scaledPos, containerRect, 1);
            setPlaceholderPos(clampedPos);
        },
        [scale]
    );

    const handleDragOver = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDraggingOver) {
                setIsDraggingOver(true);
            }
            const container = containerRef.current;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const zoomScale = scale / 100;
            const relativePos = calculateCursorPosition(e.clientX, e.clientY, containerRect, scale);
            const scaledPos = {
                x: relativePos.x / zoomScale,
                y: relativePos.y / zoomScale,
            };
            setCurrentDragPoint(scaledPos);
            const clampedPos = clampPosition(scaledPos, containerRect, zoomScale);
            setPlaceholderPos(clampedPos);
        },
        [scale]
    );

    const [commentPos, setCommentPos] = useState(null);

    const handleCommentOver = useCallback(
        (e) => {
            // if (!isDraggingOver) {
            //   setIsDraggingOver(true);
            // }
            const container = containerRef.current;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const zoomScale = scale / 100;
            const relativePos = calculateCursorPosition(e.clientX, e.clientY, containerRect, scale);
            const scaledPos = {
                x: relativePos.x / zoomScale,
                y: relativePos.y / zoomScale,
            };
            // setCurrentDragPoint(scaledPos);
            const clampedPos = clampPosition(scaledPos, containerRect, zoomScale);
            setCommentPos(clampedPos);
        },
        [scale]
    );

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };
    const elementsRef = useRef(elements);
    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            const params = getQueryParams();
            const currentNewElement = { currentId, instanceId, instanceName, width, height, mediaType, mediaExtension };

            if (!currentId || !instanceId) return;
            try {
                const container = containerRef.current;
                if (!container) throw new Error('Container not found');
                // const groups = elements.filter((el) => el.isGroup);
                const groups = elements.filter(
                    (el) => el.isGroup && el.configuration?.pointerEvents !== 'none' && !validTags.includes(el.configuration?.tag)
                );
                const targetGroup = findNearestGroup({ x: e.clientX, y: e.clientY }, groups, null, scale);
                const transformed = targetGroup
                    ? getPosition(e, document.getElementById(targetGroup.i), containerRef, scale)
                    : getPosition(e, null, containerRef, scale);

                const newItem = createNewItem(currentNewElement, targetGroup, transformed, elementsRef.current, allComponentsRaw);

                if (false) {
                    const point = {
                        x: e.clientX,
                        y: e.clientY,
                    };

                    let insertData;

                    if (targetGroup?.configuration?.vertical) {
                        insertData = findIndexToInsert(elements, point, 'vertical', scale);
                    } else {
                        insertData = findIndexToInsert(elements, point, 'horizontal', scale);
                    }
                    setElements((prev) => updateElementsWithNewItem(prev, newItem, targetGroup, insertData?.index));
                } else {
                    setElements((prev) => updateElementsWithNewItem(prev, newItem, targetGroup, null, transformed));
                    reset;
                }
            } catch (err) {
                console.error('Error processing dropped item:', err);
                // message.error('Failed to add new component');
            }
        },
        [currentId, instanceId, instanceName, width, height, mediaType, mediaExtension, scale, elements, allComponentsRaw, reset]
    );

    const handleDrop2 = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Create the element data object
            const currentNewElement = {
                currentId,
                instanceId,
                instanceName,
                width,
                height,
                mediaType,
                mediaExtension,
            };

            if (!currentId || !instanceId) return;

            try {
                // Make sure we have the container reference
                const fixedContainer = containerRef2.current;
                if (!fixedContainer) throw new Error('Fixed container not found');

                // Filter for valid groups
                const groups = elements.filter(
                    (el) => el.isGroup && el.configuration?.pointerEvents !== 'none' && !validTags.includes(el.configuration?.tag)
                );

                // Calculate the drop position with our enhanced function
                const position = getPosition2(e, null, containerRef, containerRef2, scale);
                if (!position) return;

                // Only find a target group if we're not intentionally positioning outside
                // when the container is scaled down
                const shouldFindTargetGroup = position.isOutside && !(scale < 100);

                const targetGroup = shouldFindTargetGroup
                    ? findNearestGroup({ x: e.clientX, y: e.clientY }, groups, null, scale)
                    : null;

                // Create the new item with our position
                const newItem = createNewItem(currentNewElement, targetGroup, position, elementsRef.current, allComponentsRaw);

                // Update the elements with the new item
                setElements((prev) => updateElementsWithNewItem(prev, newItem, targetGroup, null, position));

                // Reset the drag state
                reset();
            } catch (err) {
                console.error('Error processing dropped item:', err);
            }
        },
        [currentId, instanceId, instanceName, width, height, mediaType, mediaExtension, scale, elements, allComponentsRaw, reset]
    );

    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    };

    const params = useParams();

    const handleDropWithState = useCallback(
        (e) => {
            handleDrop(e);
            setIsDraggingOver(false);
        },
        [handleDrop, setIsDraggingOver]
    );

    const handleDropWithState2 = useCallback(
        (e) => {
            handleDrop2(e);
            setIsDraggingOver(false);
        },
        [handleDrop2, setIsDraggingOver]
    );

    useEffect(() => {
        const container = containerRef.current;
        const container2 = containerRef2.current;
        // message.success(instanceId)

        if (container) {
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('dragleave', handleDragLeave);
            container.addEventListener('drop', handleDropWithState);
            return () => {
                container.removeEventListener('dragover', handleDragOver);
                container.removeEventListener('dragleave', handleDragLeave);
                container.removeEventListener('drop', handleDropWithState);
            };
        }
        if (container2) {
            container2.addEventListener('dragover', handleDragOver);
            container2.addEventListener('dragleave', handleDragLeave);
            // container2.addEventListener('drop', handleDropWithState);
            return () => {
                container2.removeEventListener('dragover', handleDragOver);
                container2.removeEventListener('dragleave', handleDragLeave);
                // container2.removeEventListener('drop', handleDropWithState);
            };
        }
    }, [handleDragOver, handleDragLeave, handleDropWithState, instanceId]);
    useEffect(() => {
        const cleanup = initializeControlBoxPositioning();
        return cleanup;
    }, []);
    const [draggingElement, setDraggingElement] = useState(null);
    const handleSelectoSelect = (e) => {
        if (isDragging) {
            e.stop();
            return;
        }
        const { startAdded, startRemoved, isDragStartEnd } = e;
        if (isDragStartEnd) return;
        const nextChilds = groupManager.selectSameDepthChilds(e.data.startTargets, startAdded, startRemoved);
        setSelectedTargets(nextChilds.targets());
        requestAnimationFrame(updateControlBoxPosition);
    };
    const handleDrag = (e) => {
        const target = e.target;
        target.style.transform = e.transform;
        if (groups[target.id]) {
            const groupTransform = e.transform;
            const children = groups[target.id].elements;
            children.forEach((childId) => {
                const childElement = document.getElementById(childId);
                if (childElement) {
                    const relativeTransform = childElement.style.transform;
                    childElement.style.transform = `${groupTransform} ${relativeTransform}`;
                }
            });
        }
    };
    useEffect(() => {
        if (!isFocused) {
            return;
        }
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.code === 'Backslash') {
                if (JSON.stringify(PanelSizes) === JSON.stringify(['0%', '100%', '0%'])) {
                    setPanelSizes(['8%', '70%', '15%']);
                } else {
                    setPanelSizes(['0%', '100%', '0%']);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [PanelSizes]);
    const currentApplication = useSelector((state) => state.currentAppState.currentApplication);
    // const urlParams = new URLSearchParams(window.location.search);
    const navigate = useNavigate();

    useEffect(() => {
        setTargets([]);
        setSelectedTargets([]);
        reset();
    }, [tab]);
    const transformRef = React.useRef(null);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (transformRef.current) {
                transformRef.current.centerView();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);
    const propsData = appState?.[tab] || {};

    useEffect(() => {
        setTimeout(() => {
            if (transformRef.current) {
                transformRef.current.centerView();
            }
            setScale(40);
        }, 100);
    }, [currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen?.size]);

    const ScalePreservingItem = ({ children, scale }) => {
        return (
            <div
                style={{
                    transform: `scale(${1 / (scale / 100)})`,
                    transformOrigin: 'center',
                }}
            >
                {children}
            </div>
        );
    };

    const layersSkeleton = () => {
        return (
            <>
                {' '}
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-20 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
                <div className="animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-6 m-2" />
                </div>
            </>
        );
    };

    const FormSkeleton = () => {
        return (
            <div className="grid grid-cols-2 gap-4 p-2">
                {/* First row - full width header */}
                <div className="col-span-2 animate-pulse">
                    <div className="bg-neutral-800 rounded-md h-4" />
                </div>

                {/* Generate 22 skeleton items in 2 columns */}
                {Array.from({ length: 50 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                        <div className="bg-neutral-800 rounded-md h-5" />
                    </div>
                ))}
            </div>
        );
    };

    // export default LayersSkeleton;
    // Draw Variables
    const {
        isDrawing,
        currentPath,
        pathPoints,
        selectedPath,
        handleDrawingMouseDown,
        handleDrawingMouseMove,
        handleDrawingMouseUp,
        setSelectedPath,
        setShowControls,
        setDraggingHandle,
        createPathData,
    } = useDrawing(scale, containerRef, setElements);

    useEffect(() => {
        // Add throttling to improve performance
        let lastUpdateTime = 0;
        const throttleThreshold = 50; // ms

        const handleMouseMoveContainer = (e) => {
            // Simple throttling to avoid excessive calculations
            const now = Date.now();
            if (now - lastUpdateTime < throttleThreshold) return;
            lastUpdateTime = now;

            if (!containerRef.current) return;

            // Get the container's bounding rectangle
            const containerRect = containerRef.current.getBoundingClientRect();

            // Get the scale factor as a decimal
            const scaleRatio = scale / 100;

            // When scale < 100%, the visual area is larger than the DOM element's bounds
            // Calculate the center point (origin of scaling)
            const containerCenterX = containerRect.left + containerRect.width / 2;
            const containerCenterY = containerRect.top + containerRect.height / 2;

            // Calculate the actual visual dimensions (inverse of scaling)
            const visualWidth = containerRect.width / scaleRatio;
            const visualHeight = containerRect.height / scaleRatio;

            // Calculate the visual boundaries
            const visualLeft = containerCenterX - visualWidth / 2;
            const visualRight = containerCenterX + visualWidth / 2;
            const visualTop = containerCenterY - visualHeight / 2;
            const visualBottom = containerCenterY + visualHeight / 2;

            // Check if mouse is within the visual boundaries
            const isInside =
                e.clientX >= visualLeft && e.clientX <= visualRight && e.clientY >= visualTop && e.clientY <= visualBottom;

            // Update state without showing a notification on every move
            setIsDroppingInContainerBounds(isInside);
        };

        document.addEventListener('mousemove', handleMouseMoveContainer);

        return () => {
            document.removeEventListener('mousemove', handleMouseMoveContainer);
        };
    }, [containerRef, scale]);

    return (
        <div
            onReset={() => { }}
            onError={(err) => {
                console.error(err);
                // message.error('Error captured by ErrorBoundary:');
                // message.error('Error on builder');
            }}
        >
            {/* <FigmaLikeEditor /> */}
            {/* <SchemaERD tables={sampleTables} /> */}
            {/* <WorkflowViewer /> */}
            {editMode ? (
                <>
                    {' '}
                    {editMode && (
                        <div className="relative w-full h-8 bg-neutral-900 p-0.5 flex border-r border-neutral-800">
                            <div className="w-full flex overflow-auto overflow-visible">
                                <button
                                    className={`
          px-3 py-1 text-xs flex items-center gap-1.5 transition-all duration-200
          border-r border-neutral-700 last:border-r-0
          ${false ? 'bg-[#1e1e1e] text-white font-medium' : 'text-neutral-500 hover:text-white hover:bg-zinc-700/50'}
        `}
                                    onClick={() => {
                                        setCreateViewDialogIsOpen(true);
                                    }}
                                >
                                    <BsPlusSquare color="green" size={14} />
                                    <span className="truncate">New Page</span>
                                </button>

                                {currentApplication?.views?.map((tabb) => (
                                    <div className="relative" key={tabb.id}>
                                        <button
                                            className={`
              px-3 py-1 text-xs flex items-center gap-1.5 transition-all duration-200
              border-r border-neutral-700 last:border-r-0
              ${tab === tabb.id
                                                    ? 'bg-[#1e1e1e] text-white font-medium'
                                                    : 'text-neutral-500 hover:text-white hover:bg-zinc-700/50'
                                                }
            `}
                                            onClick={() => {
                                                navigate(`/applications/${id}/${setting}/${tabb.id}`);
                                            }}
                                        >
                                            <CiViewTimeline size={14} />
                                            <span className="truncate">{tabb.name}</span>
                                        </button>

                                        {activeUsers?.filter((usser) => usser.page === tabb.id)?.length > 0 && (
                                            <div
                                                className="absolute -top-2 right-1 flex items-center gap-0.5 z-[2147483647]"
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                <div className="flex -space-x-2 overflow-visible">
                                                    {activeUsers
                                                        ?.filter((usser) => usser.page === tabb.id)
                                                        ?.slice(0, 3)
                                                        ?.map((user, index) => (
                                                            <div
                                                                key={user.id || index}
                                                                className="w-4 h-4 rounded-full border-2 border-neutral-900 bg-gray-300 flex items-center justify-center overflow-hidden"
                                                                style={{ zIndex: 2147483647 - index }}
                                                            >
                                                                {user.avatar ? (
                                                                    <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <FaUser className="w-3 h-3 text-neutral-700" color={user.color} />
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>

                                                {/* <div className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-4">
      <FaUsers className="w-2 h-2 mr-0.5" />
      {activeUsers?.filter((usser) => usser.page === tabb.id)?.length}
    </div> */}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div
                        className={`servly-builder-entry flex bg-neutral-900 ov border-t border-neutral-700 ${builderCursorMode === 'hand'
                                ? 'cursor-grab active:cursor-grabbing'
                                : builderCursorMode === 'draw'
                                    ? '!cursor-draw'
                                    : builderCursorMode === 'path'
                                        ? 'cursor-path'
                                        : builderCursorMode === 'comment'
                                            ? 'cursor-comment' // Assuming 'cursor-comment' is the class you want to apply
                                            : ''
                            }`}
                    >
                        <Splitter
                            onResize={(e) => {
                                setPanelSizes(e);
                            }}
                        >
                            {/* <ul className="user-list">
                {activeUsers.length}
                {activeUsers
                  .filter((userr) => userr.page === tab)
                  .map((userr) => (
                    <li key={userr._id} className="user-item">
                      <span className="user-status-indicator"></span>
                      <span className="user-name">{JSON.stringify(userr, null, 2)}</span>
                      {userr.userId === user._id && <span> (you)</span>}
                    </li>
                  ))}
              </ul> */}
                            {editMode && (
                                <Splitter.Panel min="16%" max="16%" size={'16%'} className="builder-left-panel h-fill  ">
                                    <div
                                        className="layers-panel-wrap "
                                        onClick={() => {
                                            setIsFocused(false);
                                            // setSelectedTargets([]);
                                            // setTargets([]);
                                        }}
                                    >
                                        {_.isEmpty(currentApplication) ? (
                                            layersSkeleton()
                                        ) : (
                                            <LayersPanel
                                                activeUsers={activeUsers?.filter((user) => user.page === tab)}
                                                scale={1}
                                                // elements={elements}
                                                targets={targets}
                                                setSelectedTargets={setSelectedTargets}
                                                setElements={setElements}
                                                setTargets={setTargets}
                                                handleDelete={handleDelete}
                                                currentApplication={currentApplication}
                                                allComponents={allComponentsRaw}
                                                application={application}
                                                elements={elements}
                                                selectedIds={targets.map((t) => t.id)}
                                                onDelete={(id) => {
                                                    setElements((prev) => {
                                                        const getAllNestedIds = (elementId, allElements) => {
                                                            const idsToDelete = new Set([elementId]);
                                                            const element = allElements.find((el) => el.i === elementId);
                                                            if (!element) return idsToDelete;
                                                            if (element.isGroup && element.children) {
                                                                element.children.forEach((childId) => {
                                                                    const nestedIds = getAllNestedIds(childId, allElements);
                                                                    nestedIds.forEach((id) => idsToDelete.add(id));
                                                                });
                                                            }
                                                            allElements.forEach((el) => {
                                                                if (el.parent === elementId) {
                                                                    const nestedIds = getAllNestedIds(el.i, allElements);
                                                                    nestedIds.forEach((id) => idsToDelete.add(id));
                                                                }
                                                            });
                                                            return idsToDelete;
                                                        };
                                                        const idsToDelete = getAllNestedIds(id, prev);
                                                        return prev
                                                            .map((el) => {
                                                                if (el.isGroup && el.children) {
                                                                    return {
                                                                        ...el,
                                                                        children: el.children.filter((childId) => !idsToDelete.has(childId)),
                                                                    };
                                                                }
                                                                return el;
                                                            })
                                                            .filter((el) => !idsToDelete.has(el.i));
                                                    });
                                                    setSelectedTargets((prev) => prev.filter((target) => target.id !== id));
                                                }}
                                                onLayerRename={(layer) => {
                                                    setElements(
                                                        updateObjectById(elements, layer.item.i, 'i', (item) => {
                                                            return {
                                                                ...item,
                                                                name: layer.newName,
                                                            };
                                                        })
                                                    );
                                                }}
                                                onSelect={(el, remove = false, isMultiple) => {
                                                    if (!isMultiple) {
                                                        setSelectedTargets([el]);
                                                        return;
                                                    }
                                                    if (remove) {
                                                        setSelectedTargets(targets?.filter((target) => target.id !== el.id));
                                                        return;
                                                    }
                                                    setSelectedTargets([...targets, el]);
                                                }}
                                                onVisibilityToggle={(id, body) => {
                                                    setElements((prev) => {
                                                        return prev?.map((el) => {
                                                            if (el.i === id) {
                                                                return {
                                                                    ...el,
                                                                    configuration: {
                                                                        ...el.configuration,
                                                                        ...body,
                                                                    },
                                                                };
                                                            }
                                                            return el;
                                                        });
                                                    });
                                                    setTargets([]);
                                                    setSelectedTargets([]);
                                                }}
                                                onLockToggle={(id, body) => {
                                                    setElements((prev) => {
                                                        return prev?.map((el) => {
                                                            if (el.i === id) {
                                                                return {
                                                                    ...el,
                                                                    style: {
                                                                        ...el.style,
                                                                        ...body,
                                                                    },
                                                                };
                                                            }
                                                            return el;
                                                        });
                                                    });
                                                }}
                                            />
                                        )}
                                    </div>
                                </Splitter.Panel>
                            )}
                            <Splitter.Panel className="overflow-hdidden">
                                <Splitter layout="vertical">
                                    {domInspectorOpen && editMode && (
                                        <Splitter.Panel collapsijble defaultSize="15%" min="15%" max="50%">
                                            <div className="h-full ">
                                                <DOMFlowDiagram
                                                    currentApplication={currentApplication}
                                                    page={tab}
                                                    targetElementId={'serv-container'}
                                                />
                                            </div>
                                        </Splitter.Panel>
                                    )}
                                    <Splitter.Panel>
                                        {/* <FlowBuilder /> */}
                                        {_.isEmpty(currentApplication) ? (
                                            <div className="animate-pulse">
                                                <div className="bg-neutral-800 rounded-md h-[60vh] mt-28 m-24" />
                                            </div>
                                        ) : (
                                            <TransformWrapper
                                                ref={transformRef}
                                                smooth
                                                limitToBounds={false}
                                                centerZoomedOut={true}
                                                alignmentAnimation={{
                                                    disabled: true,
                                                }}
                                                pinch={{ disabled: false }}
                                                // pinch={{ disabled: false }}
                                                initialScale={scale / 100}
                                                centerOnInit={true}
                                                keyboardControls={true}
                                                wheel={{
                                                    step: 0.01,
                                                    disabled: false,
                                                    wheelDisabled: (e) => !e.ctrlKey && !editMode,
                                                }}
                                                doubleClick={{
                                                    disabled: true,
                                                }}
                                                minScale={editMode ? 0.05 : 1}
                                                maxScale={editMode ? 20 : 1}
                                                panning={{
                                                    disabled: builderCursorMode === 'default' || builderCursorMode !== 'hand',
                                                }}
                                                className={`transformwrapper flex w-full overflow-hidden  ${builderCursorMode === 'hand'
                                                        ? 'cursor-grab active:cursor-grabbing'
                                                        : builderCursorMode === 'draw'
                                                            ? '!cursor-draw'
                                                            : builderCursorMode === 'path'
                                                                ? '!cursor-path'
                                                                : builderCursorMode === 'comment'
                                                                    ? 'cursor-comment'
                                                                    : ''
                                                    }`}
                                                zoomAnimation={{
                                                    disabled: true,
                                                }}
                                                onTransformed={(ref) => {
                                                    if (Math.round(ref.state.scale * 100) === scale) return;
                                                    setScale(Math.round(ref.state.scale * 100));
                                                }}
                                            >
                                                {({ zoomIn, zoomOut, centerView, positionX, positionY, setPositionX, setPositionY }) => (
                                                    <div
                                                        onDragOver={handleDragOver2}
                                                        onDrop={handleDropWithState2}
                                                        ref={containerRef2}
                                                        onClick={() => {
                                                            setIsFocused(true);
                                                        }}
                                                    >
                                                        {isDraggingOver && !isDroppingInContainerBounds && (
                                                            <div
                                                                style={{
                                                                    scale: scale / 100,
                                                                    position: 'absolute',
                                                                    left: 0,
                                                                    top: 0,
                                                                    transform: `translate(${placeholderPos.x || 100}px, ${placeholderPos.y || 100}px)`,
                                                                    width: `${width * (scale / 100)}px`,
                                                                    height: `${height * (scale / 100)}px`,
                                                                    border: '2px dashed #4af',
                                                                    backgroundImage: sessionStorage.getItem('temp-image-data'),
                                                                    backgroundColor: 'rgba(66, 170, 255, 0.1)',
                                                                    borderRadius: '4px',
                                                                    pointerEvents: 'none',
                                                                    transition: 'all 0.1s ease',
                                                                    zIndex: 9999999,
                                                                }}
                                                            />
                                                        )}
                                                        {activeUsers
                                                            .filter((userr) => userr.userId !== user._id && tab === userr.page) // Don't show current user's cursor
                                                            .map((activeUser) => {
                                                                if (!activeUser?.cursorPosition?.x) return null; // Skip if no cursor data

                                                                return (
                                                                    <div
                                                                        key={activeUser.userId}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            position: 'absolute',
                                                                            zIndex: '99999',
                                                                            transform: `translate(${activeUser.cursorPosition.x}px, ${activeUser.cursorPosition.y - 10
                                                                                }px)`,
                                                                            pointerEvents: 'none', // So it doesn't interfere with clicking
                                                                            transition: 'transform 0.1s ease-out', // Smooth movement
                                                                        }}
                                                                    >
                                                                        {/* Small cursor triangle pointing down */}
                                                                        <div
                                                                            style={{
                                                                                position: 'absolute',
                                                                                bottom: '-4px',
                                                                                left: '8px',
                                                                                width: '0',
                                                                                height: '0',
                                                                                // borderLeft: '4px solid transparent',
                                                                                // borderRight: '4px solid transparent',
                                                                                // borderTop: '4px solid #333',
                                                                            }}
                                                                        />
                                                                        <div className="flex">
                                                                            <PiCursorFill size={16} stroke="#090909" strokeWidth={3} />
                                                                            <div
                                                                                style={{
                                                                                    borderRadius: activeUser.borderRadius,
                                                                                    borderTopLeftRadius: '2px',
                                                                                    marginLeft: '4px',
                                                                                    marginTop: '16px',
                                                                                    background: activeUser.color,
                                                                                }}
                                                                                className={`flex gap-1 bg-[${activeUser.color}] rounded-lg px-2 py-2`}
                                                                            >
                                                                                <Avatar size={16} icon={<UserOutlined />} />
                                                                                <div className="text-xs text-white">{activeUser.userName}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        {/* <MiniMap
                        // children={}
                        width={200}
                        height={200}
                        borderColor={'black'}
                      >
                        <div className="text-red-500">tttttttttttttttttttttttttt</div>
                      </MiniMap> */}
                                                        <TransformComponent
                                                            wrapperStyle={{
                                                                width: '100%',
                                                                height: '100vh',
                                                                overflow: 'visible',
                                                                display: 'flex',
                                                                gap: '10px',
                                                                flexDirection: 'column',
                                                            }}
                                                            contentStyle={{
                                                                overflow: 'visible',
                                                                width:
                                                                    currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen
                                                                        ?.size?.width + 'px' || 'auto',
                                                                height:
                                                                    currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen
                                                                        ?.size?.height + 'px' || 'auto',
                                                                flexGrow: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                            }}
                                                            wrapperProps={{
                                                                onClick: () => {
                                                                    // setSelectedTargets([]);
                                                                    // setTargets([]);
                                                                    setIsFocused(true);
                                                                },
                                                            }}
                                                            wrapperClass={`${editMode && 'image-dropzone-target'}`}
                                                            contentClass={` ${!editMode && '!overflow-hidden'}`}
                                                        // wrapperStyle={{
                                                        //   width:
                                                        //     '100px' ||
                                                        //     currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen?.size
                                                        //       ?.width + 'px' ||
                                                        //     'auto',
                                                        //   height:
                                                        //     currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen?.size
                                                        //       ?.height + 'px' || 'auto',
                                                        // }}
                                                        // contentStyle={{

                                                        // }}
                                                        // wrapperClass="h-full w-full flex flex-grow   "
                                                        // contentClass="h-full w-full flex flex-grow   "
                                                        >
                                                            <RightMenu
                                                                pointTo={pointTo}
                                                                scale={scale}
                                                                elements={elements}
                                                                targets={targets}
                                                                setSelectedTargets={setSelectedTargets}
                                                                setElements={setElements}
                                                                setTargets={setTargets}
                                                                handleDelete={handleDelete}
                                                                handleSelectTarget={(e) => {
                                                                    try {
                                                                        const element = findNearestElement(elements, {
                                                                            x: e.clientX,
                                                                            y: e.clientY,
                                                                        });
                                                                        if (element) {
                                                                            const target = document.getElementById(element.i);
                                                                            if (target) {
                                                                                // message.info(element.i)
                                                                                setPointTo({
                                                                                    x: e.clientX,
                                                                                    y: e.clientY,
                                                                                });
                                                                            } else {
                                                                                setPointTo({
                                                                                    x: e.clientX,
                                                                                    y: e.clientY,
                                                                                });
                                                                                // message.error(`Target element with ID ${element.i} not found`);
                                                                            }
                                                                        } else {
                                                                            setPointTo({
                                                                                x: e.clientX,
                                                                                y: e.clientY,
                                                                            });
                                                                            console.warn('No element found for the given coordinates');
                                                                        }
                                                                    } catch (error) {
                                                                        console.error('Error while finding the element:', error);
                                                                        setSelectedTargets([]);
                                                                    }
                                                                }}
                                                            >
                                                                <>
                                                                    {/* <div style={{ paddingBottom: "20px", fontFamily: "Inter", alignSelf:"flex-start" }}>
                              <ScalePreservingItem scale={scale}>
                                Canvas
                              </ScalePreservingItem>
                            </div> */}

                                                                    <KeepScale>
                                                                        <Tag className="mb-2 absolute zoomed6 top-[-30px]">
                                                                            {currentApplication?.views?.find((view) => view.id === tab)?.name}
                                                                        </Tag>
                                                                    </KeepScale>

                                                                    <div
                                                                        ref={containerRef}
                                                                        className={`overflow-hidden ${builderCursorMode === 'hand'
                                                                                ? 'cursor-grab active:cursor-grabbing'
                                                                                : builderCursorMode === 'draw'
                                                                                    ? '!cursor-draw'
                                                                                    : builderCursorMode === 'path'
                                                                                        ? 'cursor-path'
                                                                                        : builderCursorMode === 'comment'
                                                                                            ? 'cursor-comment'
                                                                                            : ''
                                                                            } image-dropzone-target`}
                                                                        id="servly-builder-container"
                                                                        onClick={(e) => {
                                                                            // message.error(builderCursorMode);
                                                                            if (builderCursorMode === 'comment') {
                                                                                // message.info('ckic')
                                                                                setCommentPos(null);
                                                                                setTimeout(() => {
                                                                                    handleCommentOver(e);
                                                                                }, 1);
                                                                            }
                                                                            editMode && e.stopPropagation();
                                                                            // Only handle if we're clicking the container itself, not its children
                                                                            if (e.target === e.currentTarget && isDrawingPathActive) {
                                                                                setIsDrawingPathActive(false);
                                                                                setActiveDrawingPathId(null);
                                                                            }
                                                                            if (targets.length > 0) {
                                                                                setIsDrawingPathActive(false);
                                                                                setActiveDrawingPathId(null);
                                                                            }
                                                                        }}
                                                                        onDoubleClick={(e) => {
                                                                            // Only handle if we're clicking the container itself, not its children
                                                                            if (e.target === e.currentTarget && isDrawingPathActive) {
                                                                                setIsDrawingPathActive(false);
                                                                                setActiveDrawingPathId(null);
                                                                            }

                                                                            if (targets.length > 0) {
                                                                                setActiveDrawingPathId(null);
                                                                            }
                                                                        }}
                                                                        onContextMenu={(e) => {
                                                                            e.preventDefault();
                                                                        }}
                                                                    // onMouseEnter={() => setIsBuilderActive(true)}
                                                                    // onMouseLeave={() => setIsBuilderActive(false)}
                                                                    // onMouseDown={(e) => {
                                                                    //   if (builderCursorMode === 'draw') {
                                                                    //     handleDrawingMouseDown(e);
                                                                    //   }
                                                                    // }}
                                                                    // onMouseMove={(e) => {
                                                                    //   if (builderCursorMode === 'draw') {
                                                                    //     handleDrawingMouseMove(e);
                                                                    //   }
                                                                    //   handleDrag(e);
                                                                    // }}
                                                                    // onMouseUp={(e) => {
                                                                    //   if (builderCursorMode === 'draw') {
                                                                    //     handleDrawingMouseUp(e);
                                                                    //   }
                                                                    // }}
                                                                    >
                                                                        {editMode && currentApplication?.builderSettings?.display_grid && (
                                                                            <GridLines gridColor={currentApplication?.builderSettings?.gridColor} />
                                                                        )}
                                                                        {isDraggingOver && isDroppingInContainerBounds && (
                                                                            <div
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    left: 0,
                                                                                    top: 0,
                                                                                    transform: `translate(${placeholderPos.x || 100}px, ${placeholderPos.y || 100}px)`,
                                                                                    width: width + 'px',
                                                                                    height: height + 'px',
                                                                                    border: '2px dashed #4af',
                                                                                    backgroundImage: sessionStorage.getItem('temp-image-data'),
                                                                                    backgroundColor: 'rgba(66, 170, 255, 0.1)',
                                                                                    borderRadius: '4px',
                                                                                    pointerEvents: 'none',
                                                                                    transition: 'all 0.1s ease',
                                                                                    zIndex: 9999999,
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {isDrawing && currentPath && (
                                                                            <div
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    pointerEvents: 'none',
                                                                                    zIndex: 9999,
                                                                                }}
                                                                            >
                                                                                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                                                                    <path
                                                                                        d={currentPath}
                                                                                        fill="none"
                                                                                        stroke="#000"
                                                                                        strokeWidth={2}
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        vectorEffect="non-scaling-stroke"
                                                                                    />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                        {isDrawing && currentPath && (
                                                                            <div
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    pointerEvents: 'none',
                                                                                }}
                                                                            >
                                                                                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                                                                    <path
                                                                                        d={currentPath}
                                                                                        fill="none"
                                                                                        stroke="#000"
                                                                                        strokeWidth={2}
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        vectorEffect="non-scaling-stroke"
                                                                                    />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                        {editMode && (
                                                                            <Moveable
                                                                                hideDefaultLines={isDragging}
                                                                                preventClickEventOnDrag={true}
                                                                                preventClickDefault={true}
                                                                                ref={moveableRef}
                                                                                onResizeGroup={(e) => {
                                                                                    e.events.forEach((ev) => {
                                                                                        const { target, width, height, drag } = ev;
                                                                                        target.style.width = `${width}px`;
                                                                                        target.style.height = `${height}px`;
                                                                                        target.style.transform = drag.transform;
                                                                                    });
                                                                                }}
                                                                                // onResizeGroup={({ events }) => {
                                                                                //   message.info('kkkkkkk');
                                                                                //   events.forEach((ev) => {
                                                                                //     ev.target.style.width = `${ev.width}px`;
                                                                                //     ev.target.style.height = `${ev.height}px`;
                                                                                //     ev.target.style.transform = ev.drag.transform;
                                                                                //   });
                                                                                // }}
                                                                                onResizeGroupEnd={(e) => {
                                                                                    const updatedElements = elements.map((element) => {
                                                                                        const target = e.targets.find((t) => t.id === element.i);
                                                                                        if (target) {
                                                                                            return {
                                                                                                ...element,
                                                                                                style: {
                                                                                                    ...element.style,
                                                                                                    width: target.style.width,
                                                                                                    height: target.style.height,
                                                                                                    transform: target.style.transform,
                                                                                                },
                                                                                            };
                                                                                        }
                                                                                        return element;
                                                                                    });
                                                                                    setElements(updatedElements);
                                                                                }}
                                                                                onDragGroup={(e) => {
                                                                                    e.events.forEach((ev) => {
                                                                                        const { target, transform } = ev;
                                                                                        target.style.transform = transform;
                                                                                    });
                                                                                }}
                                                                                onDragGroupEnd={(e) => {
                                                                                    const updatedElements = elements.map((element) => {
                                                                                        const target = e.targets.find((t) => t.id === element.i);
                                                                                        if (target) {
                                                                                            return {
                                                                                                ...element,
                                                                                                style: {
                                                                                                    ...element.style,
                                                                                                    transform: target.style.transform,
                                                                                                },
                                                                                            };
                                                                                        }
                                                                                        return element;
                                                                                    });
                                                                                    setElements(updatedElements);
                                                                                }}
                                                                                draggable={
                                                                                    currentApplication?.builderSettings?.draggable &&
                                                                                    editMode &&
                                                                                    builderCursorMode !== 'draw'
                                                                                }
                                                                                onSnap={(e) => { }}
                                                                                isDisplaySnapDigit={true}
                                                                                isDisplayInnerSnapDigit={false}
                                                                                warpable={currentApplication?.builderSettings?.warpable && editMode}
                                                                                rotatable={currentApplication?.builderSettings?.rotatable && editMode}
                                                                                scalable={currentApplication?.builderSettings?.scalable && editMode}
                                                                                ables={[!isDragging && Guidelines]}
                                                                                props={{
                                                                                    dimensionViewable: true,
                                                                                    editable: true,
                                                                                    proximityGuides: true,
                                                                                    guidelines: true,
                                                                                }}
                                                                                elementGuidelines={['.guideline', ...elements?.map((el) => `.${el.i}`)]}
                                                                                verticalGuidelines={[0, 100, 200, 300]}
                                                                                horizontalGuidelines={[0, 100, 200, 300]}
                                                                                // verticalGuidelines={
                                                                                //   currentApplication?.builderSettings?.snap_vertical ? [0, 100, 200, 300] : []
                                                                                // }
                                                                                // horizontalGuidelines={
                                                                                //   currentApplication?.builderSettings?.snap_horizontal ? [0, 100, 200, 300] : []
                                                                                // }
                                                                                target={
                                                                                    builderCursorMode === 'hand' || builderCursorMode === 'draw' ? null : targets
                                                                                }
                                                                                throttleDrag={1}
                                                                                edgeDraggable={currentApplication?.builderSettings?.edge_draggable}
                                                                                startDragRotate={0}
                                                                                throttleDragRotate={0}
                                                                                keepRatio={currentApplication?.builderSettings?.keep_ratio}
                                                                                throttleScale={0}
                                                                                snappable={currentApplication?.builderSettings?.snappable}
                                                                                snapDirections={{
                                                                                    top: true,
                                                                                    left: true,
                                                                                    bottom: true,
                                                                                    right: true,
                                                                                    center: true,
                                                                                    middle: true,
                                                                                }}
                                                                                elementSnapDirections={{
                                                                                    top: true,
                                                                                    left: true,
                                                                                    bottom: true,
                                                                                    right: true,
                                                                                    center: true,
                                                                                    middle: true,
                                                                                }}
                                                                                isDisplaySnapDigit={true}
                                                                                snapDigit={0}
                                                                                maxSnapElementGapDistance={80}
                                                                                snapGridWidth={10}
                                                                                snapGridHeight={10}
                                                                                isDisplayGridGuidelines={true}
                                                                                resizable={currentApplication?.builderSettings?.resizable && !isDragging && editMode}
                                                                                scrollable={currentApplication?.builderSettings?.scrollable && editMode}
                                                                                scrollOptions={{
                                                                                    container: '.scrollArea',
                                                                                    threshold: 30,
                                                                                    checkScrollEvent: false,
                                                                                    throttleTime: 0,
                                                                                }}
                                                                                controlPadding={8}
                                                                                className={`moveable-invisible-controls ${isDragging ? 'no-border' : ''}`}
                                                                                controlSize={12}
                                                                                isDisplayInnerSnapDigit={false}
                                                                                // snapDigit={0}
                                                                                defaultGroupOrigin={'50% 50%'}
                                                                                // renderDirections={[]}
                                                                                renderDirections={!isDragging ? ['nw', 'se', 'ne', 'sw'] : []}
                                                                                origin={currentApplication?.builderSettings?.show_origin}
                                                                                onClick={(e) => {
                                                                                    if (builderCursorMode === 'comment') {
                                                                                        // message.info('ckic')
                                                                                        // setCommentPos(null);
                                                                                        // setTimeout(() => {
                                                                                        //   handleCommentOver(e);
                                                                                        // }, 1);
                                                                                        // return
                                                                                    }
                                                                                    if (!editMode) return;
                                                                                    let list = [];
                                                                                    setSelectedTargets([]);
                                                                                    const findNearestElement = (sortedElements, point) => {
                                                                                        for (const { element, domElement } of sortedElements) {
                                                                                            const rect = domElement.getBoundingClientRect();

                                                                                            // Skip virtual elements
                                                                                            if (element.isVirtual) continue;

                                                                                            // Check if point is inside the element
                                                                                            if (
                                                                                                point.x >= rect.left &&
                                                                                                point.x <= rect.right &&
                                                                                                point.y >= rect.top &&
                                                                                                point.y <= rect.bottom
                                                                                            ) {
                                                                                                return element; // Return immediately once the first matching element is found
                                                                                            }
                                                                                        }

                                                                                        return null; // Return null if no matching element is found
                                                                                    };

                                                                                    const sortedElements = elements
                                                                                        .map((el) => ({
                                                                                            element: el,
                                                                                            domElement: document.getElementById(el.i),
                                                                                            zIndex: parseInt(el.configuration?.zIndex || '0', 10),
                                                                                        }))
                                                                                        .filter(({ domElement }) => domElement !== null)
                                                                                        .sort((a, b) => b?.zIndex - a?.zIndex);

                                                                                    const element = findNearestElement(sortedElements, {
                                                                                        x: e.clientX,
                                                                                        y: e.clientY,
                                                                                    });
                                                                                    // message.info(element.name);
                                                                                    if (element) {
                                                                                        const target = document.getElementById(element.i);
                                                                                        setSelectedTargets([target]);
                                                                                    }
                                                                                }}
                                                                                edge={true}
                                                                                onWarp={onWarp}
                                                                                // bounds={null}
                                                                                className="moveable-invisible-controls"
                                                                                onDragStart={handleDragStart}
                                                                                onDragEnd={handleDragEnd}
                                                                                onDrag={handleDrag}
                                                                                onRotate={(e) => {
                                                                                    const { target, beforeRotate } = e;
                                                                                    let newRotate = beforeRotate;
                                                                                    if (isShiftPressed) {
                                                                                        newRotate = snapToAngle(beforeRotate);
                                                                                    }
                                                                                    // message.error(target.style.transform);
                                                                                    // if(newRotate ) {
                                                                                    target.style.transform = updateTransformRotation(
                                                                                        target.style.transform,
                                                                                        newRotate
                                                                                    );

                                                                                    // setElements((prev) =>
                                                                                    //   prev?.map((item) => {
                                                                                    //     if (item.i === target.id) {
                                                                                    //       return {
                                                                                    //         ...item,
                                                                                    //         style: {
                                                                                    //           ...item.style,
                                                                                    //           transform: updateTransformRotation(item.style.transform, newRotate),
                                                                                    //         },
                                                                                    //       };
                                                                                    //     }
                                                                                    //     return item;
                                                                                    //   })
                                                                                    // );
                                                                                }}
                                                                                onResize={(e) => {
                                                                                    e.target.style.width = `${e.width}px`;
                                                                                    e.target.style.height = `${e.height}px`;
                                                                                    e.target.style.transform = e.drag.transform;
                                                                                }}
                                                                                onResizeStart={() => {
                                                                                    setIsResizing(true);
                                                                                }}
                                                                                onResizeEnd={handleResizeStop}
                                                                                onRenderGroup={(e) => {
                                                                                    e.events.forEach((ev) => {
                                                                                        ev.target.style.cssText += ev.cssText;
                                                                                    });
                                                                                }}
                                                                                customStyle={{
                                                                                    '.moveable-control-box': {
                                                                                        '--moveable-color': '#4a90e2',
                                                                                    },
                                                                                    '.moveable-control': {
                                                                                        width: '24px !important',
                                                                                        height: '24px !important',
                                                                                        margin: '-12px !important',
                                                                                        border: 'none !important',
                                                                                        background: 'transparent !important',
                                                                                    },
                                                                                    '.moveable-direction': {
                                                                                        width: '4px !important',
                                                                                        height: '4px !important',
                                                                                        background: 'var(--moveable-color) !important',
                                                                                    },
                                                                                    '.moveable-line': {
                                                                                        background: 'var(--moveable-color) !important',
                                                                                        opacity: '0.4 !important',
                                                                                        height: '0.5px !important',
                                                                                    },
                                                                                    '.moveable-guideline': {
                                                                                        background: '#4a90e2 !important',
                                                                                        opacity: '0.5 !important',
                                                                                        width: '0.px !important',
                                                                                    },
                                                                                    '.moveable-gap': {
                                                                                        background: '#4a90e2 !important',
                                                                                        opacity: '0.8 !important',
                                                                                        width: '0.5px !important',
                                                                                    },
                                                                                }}
                                                                                bounds={
                                                                                    currentApplication?.builderSettings?.bounds
                                                                                        ? { left: 0, top: 0, right: 0, bottom: 0, position: 'css' }
                                                                                        : null
                                                                                }
                                                                                defaultGuidelines={[
                                                                                    { type: 'vertical', pos: '0%', className: 'red' },
                                                                                    { type: 'vertical', pos: '50%', className: 'red' },
                                                                                    { type: 'vertical', pos: '100%', className: 'red' },
                                                                                    { type: 'horizontal', pos: '0%', className: 'red' },
                                                                                    { type: 'horizontal', pos: '50%', className: 'red' },
                                                                                    { type: 'horizontal', pos: '100%', className: 'red' },
                                                                                ]}
                                                                            ></Moveable>
                                                                        )}
                                                                        {editMode && (
                                                                            <Selecto
                                                                                ref={selectoRef}
                                                                                className="custom-drag-area "
                                                                                selectFromInside={false}
                                                                                toggleContinueSelect={['ctrl']}
                                                                                ratio={0}
                                                                                onDragStart={(e) => {
                                                                                    // message.warning('here');

                                                                                    // setTimeout(() => {
                                                                                    //   handleCommentOver(e);
                                                                                    // }, 1);

                                                                                    if (!editMode) return;

                                                                                    // if (
                                                                                    //   e.inputEvent.target.id &&
                                                                                    //   !elements?.find((el) => el.i === e.inputEvent.target.id)
                                                                                    // ) {
                                                                                    //   e?.stop();
                                                                                    //   return;
                                                                                    // }
                                                                                    if (isDragging || isResizing) {
                                                                                        e.stop();
                                                                                        return;
                                                                                    }
                                                                                    const moveable = moveableRef.current;
                                                                                    const target = e.inputEvent.target;
                                                                                    const flatted = deepFlat(targets);
                                                                                    if (
                                                                                        target.tagName === 'BUTTON' ||
                                                                                        moveable.isMoveableElement(target) ||
                                                                                        flatted.some((t) => t === target || t.contains(target))
                                                                                    ) {
                                                                                        e.stop();
                                                                                    }
                                                                                    e.data.startTargets = targets;
                                                                                }}
                                                                                onSelectEnd={(e) => {
                                                                                    if (!editMode) return;
                                                                                    const { isDragStartEnd, isClick, added, removed, inputEvent } = e;
                                                                                    const moveable = moveableRef.current;
                                                                                    if (isDragStartEnd) {
                                                                                        inputEvent.preventDefault();
                                                                                        moveable.waitToChangeTarget().then(() => moveable.dragStart(inputEvent));
                                                                                    }
                                                                                    const nextChilds =
                                                                                        isDragStartEnd || isClick
                                                                                            ? groupManager.selectCompletedChilds(e.data.startTargets, added, removed)
                                                                                            : groupManager.selectSameDepthChilds(e.data.startTargets, added, removed);
                                                                                    e.currentTarget.setSelectedTargets(nextChilds.flatten());
                                                                                    setSelectedTargets(nextChilds.targets());
                                                                                }}
                                                                                selectableTargets={['.selecto-area .cube:not([data-virtual="true"])']}
                                                                                onSelect={(e) => {
                                                                                    if (!editMode) return;
                                                                                    const { rect } = e;
                                                                                    if (rect) {
                                                                                        const transformed = getPosition(e, null, containerRef, scale);
                                                                                        rect.left = transformed.x;
                                                                                        rect.top = transformed.y;
                                                                                    }
                                                                                    handleSelectoSelect(e);
                                                                                }}
                                                                                hitRate={0}
                                                                                selectByClick={true}
                                                                                // disabled={builderCursorMode === 'draw'}

                                                                                disabled={!editMode || isDrawingPathActive || builderCursorMode !== 'default'}

                                                                            // disabled={builderCursorMode === 'draw'}
                                                                            />
                                                                        )}
                                                                        <div key={comments}>
                                                                            {reviewMode &&
                                                                                comments?.map((item, i) => {
                                                                                    // Only show comments and filter replies
                                                                                    if (!item?.parentComment) {
                                                                                        return (
                                                                                            <FloatingComment
                                                                                                key={i}
                                                                                                savingComment={savingComment}
                                                                                                x={item?.position?.x}
                                                                                                isCollapsedd={true}
                                                                                                y={item?.position?.y}
                                                                                                isNewComment={false}
                                                                                                initialComment={item}
                                                                                                allCommnents={comments}
                                                                                                currentUser={user}
                                                                                                onClose={async (id) => {
                                                                                                    // setCommentPos(null);
                                                                                                    await resolveComment(id);
                                                                                                    fetchData();
                                                                                                }}
                                                                                                onSave={async (text, position) => {
                                                                                                    // message.info(text);
                                                                                                    await handleSaveComment(text, 'page');
                                                                                                    // fetchData();
                                                                                                    setCommentPos(null);
                                                                                                    // setrefreshData(Date.now());
                                                                                                }}
                                                                                                onEdit={async (id, formData) => {
                                                                                                    await updateComment(id, formData);
                                                                                                    fetchData();
                                                                                                }}
                                                                                                onReply={async (parentId, replyObj) => {
                                                                                                    await addCommentReply(parentId, replyObj);
                                                                                                    fetchData();
                                                                                                }}
                                                                                                onResolve={async (id) => {
                                                                                                    await resolveComment(id);
                                                                                                }}
                                                                                                onDelete={async (id) => {
                                                                                                    await deleteComment(id);
                                                                                                    fetchData();
                                                                                                }}
                                                                                            />
                                                                                        );
                                                                                    }
                                                                                    return null;
                                                                                })}
                                                                            {!isEmpty(commentPos) && editMode && builderCursorMode === 'comment' && (
                                                                                <>
                                                                                    <FloatingComment
                                                                                        savingComment={savingComment}
                                                                                        x={commentPos.x}
                                                                                        y={commentPos.y}
                                                                                        isNewComment={true}
                                                                                        initialComment={''}
                                                                                        onClose={() => {
                                                                                            setCommentPos(null);
                                                                                        }}
                                                                                        onSave={async (text, position) => {
                                                                                            // message.info(text);
                                                                                            await handleSaveComment(text, 'page');
                                                                                        }}
                                                                                        currentUser={user}
                                                                                    />
                                                                                </>
                                                                            )}
                                                                            <ConfigProvider
                                                                                theme={{
                                                                                    algorithm: theme.defaultAlgorithm,
                                                                                    components: {
                                                                                        Table: {
                                                                                            headerBg: undefined, // Default background
                                                                                            headerColor: undefined, // Default text color
                                                                                            headerSortActiveBg: undefined, // Default sort active background
                                                                                            headerSortHoverBg: undefined, // Default hover state
                                                                                            colorBgContainer: undefined, // Default container background
                                                                                            rowBg: undefined, // Default row background
                                                                                            borderColor: undefined, // Default table border color
                                                                                            rowHoverBg: undefined, // Default row hover background
                                                                                        },
                                                                                    },
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    id="serv-container"
                                                                                    className={`elements ${editMode && !isDrawingPathActive && builderCursorMode === 'default'
                                                                                            ? 'selecto-area'
                                                                                            : ''
                                                                                        }`}
                                                                                >
                                                                                    {/* <RenderElements2            setCommentPos={handleCommentOver}
                                            targets={targets}
                                            elements={elements}
                                            readOnly={false}
                                            tab={tab}
                                            navigate={navigate}
                                            appState={appState}
                                            parentId={null}
                                            editMode={editMode}
                                            isDrawingPathActive={isDrawingPathActive}
                                            setIsDrawingPathActive={setIsDrawingPathActive}
                                            activeDrawingPathId={activeDrawingPathId}
                                            setActiveDrawingPathId={setActiveDrawingPathId}
                                            setSelectedElements={setSelectedTargets}
                                            isDragging={isDragging}
                                            flattenStyleObject={flattenStyleObject}
                                         
                                            renderComponent={renderComponent}
                                            currentApplication={currentApplication}
                                            builderCursorMode={builderCursorMode} parentConfig={parentConfig}/> */}
                                                                                    <ElementRenderer
                                                                                        setItemToEdit={setElements}
                                                                                        setAppStatePartial={setAppStatePartial}
                                                                                        parentStyle={parentStyle}
                                                                                        propsData={propsData}
                                                                                        setCommentPos={handleCommentOver}
                                                                                        targets={targets}
                                                                                        dispatch={dispatch}
                                                                                        allComponentsRaw={allComponentsRaw}
                                                                                        params={params}
                                                                                        elements={elements}
                                                                                        readOnly={false}
                                                                                        tab={tab}
                                                                                        navigate={navigate}
                                                                                        appState={appState}
                                                                                        parentId={null}
                                                                                        editMode={editMode}
                                                                                        isDrawingPathActive={isDrawingPathActive}
                                                                                        setIsDrawingPathActive={setIsDrawingPathActive}
                                                                                        activeDrawingPathId={activeDrawingPathId}
                                                                                        setActiveDrawingPathId={setActiveDrawingPathId}
                                                                                        setSelectedElements={setSelectedTargets}
                                                                                        isDragging={isDragging}
                                                                                        // flattenStyleObject={flattenStyleObject}
                                                                                        // renderComponent={renderComponent}
                                                                                        store={store}
                                                                                        refreshAppAuth={refreshAppAuth}
                                                                                        setDestroyInfo={setDestroyInfo}
                                                                                        setSessionInfo={setSessionInfo}
                                                                                        storeInvocation={storeInvocation}
                                                                                        currentApplication={currentApplication}
                                                                                        builderCursorMode={builderCursorMode}
                                                                                    />
                                                                                </div>{' '}
                                                                            </ConfigProvider>
                                                                        </div>
                                                                    </div>

                                                                    {/* {editMode && (
                                    <ImageDropzone
                                      targetClassName="image-dropzone-target"
                                      onDragEnter={async (imageData) => {
                                        message.info(`Processing ${imageData.fileName}`);
                                      }}
                                      onImageDrop={async (imageData) => {
                                        try {
                                          const maxSize = 1 * 1024 * 1024;
                                          if (imageData.fileSize >= maxSize) {
                                            message.info("File maximum size is 5mb. Try a smaller file");
                                            return;
                                          }
                                        } catch (error) {
                                          console.error('Error processing image:', error);
                                        }
                                      }}
                                    />
                                  )} */}
                                                                </>
                                                            </RightMenu>
                                                        </TransformComponent>
                                                        {editMode && (
                                                            <div className="zoomed6 fixed w-full max-w-4xl mx-auto bottom-8 left-1/2 -translate-x-1/2 px-4">
                                                                <div className="flex justify-between items-center w-full">
                                                                    { }
                                                                    <div className="border border-neutral-700 bg-neutral-800 rounded-full shadow-lg flex items-center gap-2 p-2">
                                                                        <div className="flex items-center gap-1 pl-1">
                                                                            <button
                                                                                className={`p-1.5 rounded hover:bg-neutral-700 ${canUndo ? 'text-neutral-300' : 'text-neutral-600'
                                                                                    }`}
                                                                                onClick={canUndo ? handleUndo : undefined}
                                                                                disabled={!canUndo}
                                                                            >
                                                                                <UndoOutlined size={16} />
                                                                            </button>
                                                                            <button
                                                                                disabled={!canRedo}
                                                                                className={`p-1.5 rounded hover:bg-neutral-700 ${canRedo ? 'text-neutral-300' : 'text-neutral-600'
                                                                                    }`}
                                                                                onClick={canRedo ? handleRedo : undefined}
                                                                            >
                                                                                <RedoOutlined size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <BuilderPrimitivesProvider
                                                                        setCursorMode={(val) => {
                                                                            setSelectedTargets([]);
                                                                            // message.info(val);
                                                                            setBuilderCursorMode(val);
                                                                            if (val !== 'comment') {
                                                                                setReviewMode(false);
                                                                                setCommentPos(null);
                                                                            } else {
                                                                                setReviewMode(true);
                                                                            }
                                                                        }}
                                                                    >
                                                                        { }
                                                                        <div className="bg-neutral-900 rounded-full flex gap-8 px-5 py-4 border border-neutral-700 shadow-lg">
                                                                            <div className="flex gap-4 items-center">
                                                                                {localStorage.getItem(currentApplication._id + '-' + 'sessionInfo') && (
                                                                                    <Tooltip title="Clear Local Store" placement="top">
                                                                                        <button
                                                                                            className="hover:text-blue-500 p-2"
                                                                                            onClick={() => {
                                                                                                dispatch(
                                                                                                    setDestroyInfo({
                                                                                                        id: id + '-sessionInfo',
                                                                                                    })
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            {editMode ? <BsDatabaseFillX size={24} /> : <BsPencilSquare size={24} />}
                                                                                        </button>
                                                                                    </Tooltip>
                                                                                )}
                                                                                {/* <button
                                              className="hover:text-blue-500 p-2"
                                              onClick={() => {
                                                dispatch(
                                                  setDestroyInfo({
                                                    id: id + '-sessionInfo',
                                                  })
                                                );
                                              }}
                                            >
                                         <BiSolidCommentAdd size={24} />
                                            </button> */}

                                                                                <div className="mr-1">
                                                                                    <button
                                                                                        className="hover:text-blue-500 p-2"
                                                                                        onClick={() => {
                                                                                            setScale(editMode ? 100 : 80);
                                                                                            setEditMode(!editMode);
                                                                                            setSelectedTargets([]);
                                                                                        }}
                                                                                    >
                                                                                        {editMode ? <BsEye size={24} /> : <BsPencilSquare size={24} />}
                                                                                    </button>
                                                                                </div>
                                                                                {BuilderPrimitiveTypes.map((type) => (
                                                                                    <div key={type.name} className="flex items-center">
                                                                                        {type.element}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </BuilderPrimitivesProvider>

                                                                    <div className="border border-neutral-700 bg-neutral-800 rounded-full shadow-lg flex items-center gap-2 p-2">
                                                                        <div className="flex items-center">
                                                                            <button
                                                                                className="p-1.5 rounded hover:bg-neutral-700 text-neutral-300"
                                                                                onClick={(e) => zoomOut()}
                                                                            >
                                                                                <HiZoomOut size={16} />
                                                                            </button>
                                                                            <span className="text-neutral-300 text-xs px-2 min-w-[30px] text-center">
                                                                                {/* {scale}% */}
                                                                                <InlineEditText
                                                                                    overRideStyles={{ width: 'fit-content' }}
                                                                                    initialText={JSON.stringify(scale) + '%'}
                                                                                    onType={(e) => setScale(e.target.value)}
                                                                                />
                                                                            </span>
                                                                            <button
                                                                                className="p-1.5 rounded hover:bg-neutral-700 text-neutral-300"
                                                                                onClick={() => zoomIn()}
                                                                            >
                                                                                <HiZoomIn size={16} />
                                                                            </button>
                                                                            <button
                                                                                className="p-1.5 rounded hover:bg-neutral-700 text-neutral-300"
                                                                                onClick={() => centerView(0.4)}
                                                                            >
                                                                                <MdCenterFocusStrong size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </TransformWrapper>
                                        )}
                                    </Splitter.Panel>
                                </Splitter>
                            </Splitter.Panel>

                            {editMode && (
                                <Splitter.Panel min="20%" max="20%" size={'20%'} className=" overflow-auto">
                                    <div
                                        className=""
                                        onClick={() => {
                                            setIsFocused(false);
                                            // setSelectedTargets([]);
                                            // setTargets([]);
                                        }}
                                    >
                                        {_.isEmpty(currentApplication) ? FormSkeleton() : Editor}
                                    </div>
                                </Splitter.Panel>
                            )}
                        </Splitter>
                    </div>
                </>
            ) : (
                <DeviceFrameWrapper>
                    {/* Your content goes here */}
                    <ConfigProvider
                        theme={{
                            algorithm: theme.defaultAlgorithm,
                            components: {
                                Table: {
                                    headerBg: undefined, // Default background
                                    headerColor: undefined, // Default text color
                                    headerSortActiveBg: undefined, // Default sort active background
                                    headerSortHoverBg: undefined, // Default hover state
                                    colorBgContainer: undefined, // Default container background
                                    rowBg: undefined, // Default row background
                                    borderColor: undefined, // Default table border color
                                    rowHoverBg: undefined, // Default row hover background
                                },
                            },
                        }}
                    >
                        {/* <FitScreen
              mode="fit"
              width={currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen?.size?.width}
              height={currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen?.size?.height}
              // style={parentStyle}comment
            > */}
                        <ElementRenderer
                            setItemToEdit={setElements}
                            setAppStatePartial={setAppStatePartial}
                            parentStyle={parentStyle}
                            propsData={propsData}
                            setCommentPos={handleCommentOver}
                            targets={targets}
                            dispatch={dispatch}
                            allComponentsRaw={allComponentsRaw}
                            params={params}
                            elements={elements}
                            readOnly={false}
                            tab={tab}
                            navigate={navigate}
                            appState={appState}
                            parentId={null}
                            editMode={editMode}
                            isDrawingPathActive={isDrawingPathActive}
                            setIsDrawingPathActive={setIsDrawingPathActive}
                            activeDrawingPathId={activeDrawingPathId}
                            setActiveDrawingPathId={setActiveDrawingPathId}
                            setSelectedElements={setSelectedTargets}
                            isDragging={isDragging}
                            // flattenStyleObject={flattenStyleObject}
                            // renderComponent={renderComponent}
                            store={store}
                            refreshAppAuth={refreshAppAuth}
                            setDestroyInfo={setDestroyInfo}
                            setSessionInfo={setSessionInfo}
                            storeInvocation={storeInvocation}
                            currentApplication={currentApplication}
                            builderCursorMode={builderCursorMode}
                        />
                        {/* </FitScreen> */}
                    </ConfigProvider>
                </DeviceFrameWrapper>
            )}{' '}
            <>
                {' '}
                {!editMode && (
                    <FloatButton
                        shape="square"
                        type="primary"
                        style={{
                            insetInlineEnd: 24,
                        }}
                        icon={<PiPencilDuotone />}
                        onClick={(e) => {
                            e.preventDefault();
                            setEditMode(true);
                            setSelectedTargets([]);
                            setScale(40);
                            setTimeout(() => {
                                transformRef.current.centerView();
                            }, 50);
                            // setScale(40);
                        }}
                    />
                )}
            </>
        </div>
    );
};