/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */
'use strict';

//var Node = require('./avl-node.js');

/**
 * Creates a new AVL Tree.
 * @constructor
 * @class AvlTree
 * @classDesc constructs a regular AVL tree of objects associated with some key. two weard functions in here though are added to facilitate continuous sampling of descreet data. these are the getNearestGreaterThan and  * @classDesc constructs a regular AVL tree of objects associated with some key. two weard functions in here though are added to facilitate continuous sampling of descreet data. these are the getNearestGreaterThan and getNearestLessThan functions that allow you to provide a key and the tree will return the object with the closest key in the given direction
 * @param {function} [customCompare] An optional custom compare function. otherwise the keys will be compared as primitives using '<' and '>'
 *
 * @property {bool} overwriteDuplicatesOnInsert Determines weather inserts on pre-existing keys are ignored or overwrite the value in the existing node. Default value true, means overwrite will occur
 * @property {Node} _root root of the tree
 * @property {number} _size number of nodes in the tree
 */
function AvlTree(customCompare) {
    this._root = null;
    this._size = 0;
    this.overwriteDuplicatesOnInsert = true;
    if (customCompare) {
        this._compare = customCompare;
    }
}

/**
 * Compares two keys with each other.
 *
 * @private
 * @param {Object} a The first key to compare.
 * @param {Object} b The second key to compare.
 * @return {number} -1, 0 or 1 if a < b, a == b or a > b respectively.
 */
AvlTree.prototype._compare = function (a, b) {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
};

/**
 * Inserts a new node with a specific key into the tree.
 *
 * @param {Object} key The key being inserted.
 * @param {Object} value The value being inserted.
 */
AvlTree.prototype.insert = function (key, value) {
    this._root = this._insert(key, value, this._root);
    this._size++;
};

/**
 * Inserts a new node with a specific key into the tree.
 *
 * @private
 * @param {Object} key The key being inserted.
 * @param {value} value The payload data
 * @param {Node} root The root of the tree to insert in.
 * @return {Node} The new tree root.
 */
AvlTree.prototype._insert = function (key, value, root) {
    // Perform regular BST insertion
    if (root === null) {
        return new Node(key, value);
    }

    if (this._compare(key, root.key) < 0) {
        root.left = this._insert(key, value, root.left);
    } else if (this._compare(key, root.key) > 0) {
        root.right = this._insert(key, value, root.right);
    } else {
        // It's a duplicate so decrement size to make up for it
        // which will not increase the number of data points
        this._size--;
        if (this.overwriteDuplicatesOnInsert)
        {
            root.value = value;
        }
        return root;
    }

    // Update height and rebalance tree
    root.height = Math.max(root.leftHeight(), root.rightHeight()) + 1;
    var balanceState = getBalanceState(root);

    if (balanceState === BalanceState.UNBALANCED_LEFT) {
        if (this._compare(key, root.left.key) < 0) {
            // Left left case
            root = root.rotateRight();
        } else {
            // Left right case
            root.left = root.left.rotateLeft();
            return root.rotateRight();
        }
    }

    if (balanceState === BalanceState.UNBALANCED_RIGHT) {
        if (this._compare(key, root.right.key) > 0) {
            // Right right case
            root = root.rotateLeft();
        } else {
            // Right left case
            root.right = root.right.rotateRight();
            return root.rotateLeft();
        }
    }

    return root;
};

/**
 * Deletes a node with a specific key from the tree.
 *
 * @param {Object} key The key being deleted.
 */
AvlTree.prototype.delete = function (key) {
    this._root = this._delete(key, this._root);
    this._size--;
};

/**
 * Deletes a node with a specific key from the tree.
 *
 * @private
 * @param {Object} key The key being deleted.
 * @param {Node} root The root of the tree to delete from.
 * @return {Node} The new tree root.
 */
AvlTree.prototype._delete = function (key, root) {
    // Perform regular BST deletion
    if (root === null) {
        this._size++;
        return root;
    }

    if (this._compare(key, root.key) < 0) {
        // The key to be deleted is in the left sub-tree
        root.left = this._delete(key, root.left);
    } else if (this._compare(key, root.key) > 0) {
        // The key to be deleted is in the right sub-tree
        root.right = this._delete(key, root.right);
    } else {
        // root is the node to be deleted
        if (!root.left && !root.right) {
            root = null;
        } else if (!root.left && root.right) {
            root = root.right;
        } else if (root.left && !root.right) {
            root = root.left;
        } else {
            // Node has 2 children, get the in-order successor
            var inOrderSuccessor = minValueNode(root.right);
            root.key = inOrderSuccessor.key;
            root.right = this._delete(inOrderSuccessor.key, root.right);
        }
    }

    if (root === null) {
        return root;
    }

    // Update height and rebalance tree
    root.height = Math.max(root.leftHeight(), root.rightHeight()) + 1;
    var balanceState = getBalanceState(root);

    if (balanceState === BalanceState.UNBALANCED_LEFT) {
        // Left left case
        if (getBalanceState(root.left) === BalanceState.BALANCED ||
            getBalanceState(root.left) === BalanceState.SLIGHTLY_UNBALANCED_LEFT) {
            return root.rotateRight();
        }
        // Left right case
        if (getBalanceState(root.left) === BalanceState.SLIGHTLY_UNBALANCED_RIGHT) {
            root.left = root.left.rotateLeft();
            return root.rotateRight();
        }
    }

    if (balanceState === BalanceState.UNBALANCED_RIGHT) {
        // Right right case
        if (getBalanceState(root.right) === BalanceState.BALANCED ||
            getBalanceState(root.right) === BalanceState.SLIGHTLY_UNBALANCED_RIGHT) {
            return root.rotateLeft();
        }
        // Right left case
        if (getBalanceState(root.right) === BalanceState.SLIGHTLY_UNBALANCED_LEFT) {
            root.right = root.right.rotateRight();
            return root.rotateLeft();
        }
    }

    return root;
};

/**
 * Gets the value of a node within the tree with a specific key.
 *
 * @param {Object} key The key being searched for.
 * @return {Object} The value of the node or null if it doesn't exist.
 */
AvlTree.prototype.get = function (key) {
    if (this._root === null) {
        return null;
    }

    return this._get(key, this._root);
};

/**
 * Gets the value of a node within the tree with a specific key.
 *
 * @private
 * @param {Object} key The key being searched for.
 * @param {Node} localRoot The root of the tree to search in.
 * @return {Object} The value of the node or null if it doesn't exist.
 */
AvlTree.prototype._get = function (key, localRoot) {
    if (key === localRoot.key) {
        return localRoot.value;
    }

    if (this._compare(key, localRoot.key) < 0) {
        if (!localRoot.left) {
            return null;
        }
        return this._get(key, localRoot.left);
    }

    if (!localRoot.right) {
        return null;
    }
    return this._get(key, localRoot.right);
};

/**
 * Gets the value of a node within the tree with the closest key value  equal or less than the search key.
 *
 * @param {Object} key The key being searched for.
 * @return {Object} The value of the node or null if there are no keys less than the given key.
 */
AvlTree.prototype.getNearestLessThan = function (key) {
    if (this._root === null) {
        return null;
    }
    return this._getNearestLessThan(key, this._root, null);
};

/**
 * Recursively traverses down the tree to find the node with the closest key value  equal or less than the search key.
 *
 * @private
 * @param {Object} key The key being searched for.
 * @param {Node} localRoot The root of the tree to search in.
 * @param {Node} currentBest The current closest key less than our search key
 * @return {Object} The value of the node or null if there are no keys less than the given key.
 */
AvlTree.prototype._getNearestLessThan = function (key, localRoot, currentBest) {
    if (key === localRoot.key) {
        return localRoot.value;
    }
    if (this._compare(key, localRoot.key) < 0) {
        if (!localRoot.left) {
            if (currentBest) return currentBest.value;
            else return null;
        }
        return this._getNearestLessThan(key, localRoot.left, currentBest);
    }
    if (currentBest === null || this._compare(currentBest.key, localRoot.key) < 0) currentBest = localRoot;

    if (!localRoot.right) {
        if (currentBest) return currentBest.value;
        else return null;
    }
    return this._getNearestLessThan(key, localRoot.right, currentBest);
};

/**
 * Gets the value of a node within the tree with the closest key value equal or greater than the search key.
 *
 * @param {Object} key The key being searched for.
 * @return {Object} The value of the node or null if there are no keys less than the given key.
 */
AvlTree.prototype.getNearestGreaterThan = function (key) {
    if (this._root === null) {
        return null;
    }
    return this._getNearestGreaterThan(key, this._root, null);
};

/**
 * Recursively traverses down the tree to find the node with the closest key value equal or greater than the search key.
 *
 * @private
 * @param {Object} key The key being searched for.
 * @param {Node} localRoot The root of the tree to search in.
 * @param {Node} currentBest The current closest key less than our search key
 * @return {Object} The value of the node or null if there are no keys less than the given key.
 */
AvlTree.prototype._getNearestGreaterThan = function (key, localRoot, currentBest) {
    if (key === localRoot.key) {
        return localRoot.value;
    }
    if (this._compare(key, localRoot.key) > 0) {
        if (!localRoot.right) {
            if (currentBest) return currentBest.value;
            else return null;
        }
        return this._getNearestGreaterThan(key, localRoot.right, currentBest);
    }
    if (currentBest === null || this._compare(currentBest.key, localRoot.key) > 0) currentBest = localRoot;

    if (!localRoot.left) {
        if (currentBest) return currentBest.value;
        else return null;
    }
    return this._getNearestGreaterThan(key, localRoot.left, currentBest);
};

/**
 * Gets whether a node with a specific key is within the tree.
 *
 * @param {Object} key The key being searched for.
 * @return {boolean} Whether a node with the key exists.
 */
AvlTree.prototype.contains = function (key) {
    if (this._root === null) {
        return false;
    }

    return !!this._get(key, this._root);
};

/**
 * @return {Object} The minimum key in the tree.
 */
AvlTree.prototype.findMinimum = function () {
    return minValueNode(this._root).key;
};

/**
 * Gets the minimum value node, rooted in a particular node.
 *
 * @private
 * @param {Node} root The node to search.
 * @return {Node} The node with the minimum key in the tree.
 */
function minValueNode(root) {
    var current = root;
    while (current.left) {
        current = current.left;
    }
    return current;
}

/**
 * @return {Object} The maximum key in the tree.
 */
AvlTree.prototype.findMaximum = function () {
    return maxValueNode(this._root).key;
};

AvlTree.prototype.getTreeStructure = function () {
    var outStringTreeStructure = {};
    outStringTreeStructure.output = "";
    this._getTreeStructure(this._root, "", outStringTreeStructure);
    return outStringTreeStructure.output;
};

AvlTree.prototype._getTreeStructure = function (localRoot, indent, outStringTreeStructure) {
    if (!localRoot) return;

    AvlTree.prototype._getTreeStructure(localRoot.right, indent + "\t", outStringTreeStructure);

    outStringTreeStructure.output = outStringTreeStructure.output + "\n" + indent + localRoot.key + "(" + localRoot.value + ")";

    AvlTree.prototype._getTreeStructure(localRoot.left, indent + "\t", outStringTreeStructure);
};

/**
 * Gets the maximum value node, rooted in a particular node.
 *
 * @private
 * @param {Node} root The node to search.
 * @return {Node} The node with the maximum key in the tree.
 */
function maxValueNode(root) {
    var current = root;
    while (current.right) {
        current = current.right;
    }
    return current;
}

/**
 * @return {number} The size of the tree.
 */
AvlTree.prototype.size = function () {
    return this._size;
};

/**
 * @return {boolean} Whether the tree is empty.
 */
AvlTree.prototype.isEmpty = function () {
    return this._size === 0;
};

/**
 * Represents how balanced a node's left and right children are.
 *
 * @private
 */
var BalanceState = {
    UNBALANCED_RIGHT: 1,
    SLIGHTLY_UNBALANCED_RIGHT: 2,
    BALANCED: 3,
    SLIGHTLY_UNBALANCED_LEFT: 4,
    UNBALANCED_LEFT: 5
};

/**
 * Gets the balance state of a node, indicating whether the left or right
 * sub-trees are unbalanced.
 *
 * @private
 * @param {Node} node The node to get the difference from.
 * @return {BalanceState} The BalanceState of the node.
 */
function getBalanceState(node) {
    var heightDifference = node.leftHeight() - node.rightHeight();
    switch (heightDifference) {
        case -2: return BalanceState.UNBALANCED_RIGHT;
        case -1: return BalanceState.SLIGHTLY_UNBALANCED_RIGHT;
        case 1: return BalanceState.SLIGHTLY_UNBALANCED_LEFT;
        case 2: return BalanceState.UNBALANCED_LEFT;
        default: return BalanceState.BALANCED;
    }
}

//module.exports = AvlTree;