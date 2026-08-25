import PropTypes from 'prop-types';

export const Blank = ({ children }) => {
    return (
        <>
            {children}
        </>
    )
}

Blank.propTypes = {
    children: PropTypes.node.isRequired,
};
